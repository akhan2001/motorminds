import { createClient } from '@/utils/supabase/client'
import type {
  InvoiceItem,
  InvoiceItemCreateData,
  InvoiceItemUpdateData,
  InvoiceItemSummary,
  WorkOrderItemImport,
} from '../types/invoice-items'

class InvoiceItemsService {
  private supabase = createClient()

  /**
   * Get all items for an invoice
   */
  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await this.supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch invoice items:', error)
      throw new Error(`Failed to fetch invoice items: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single invoice item
   */
  async getInvoiceItem(itemId: string): Promise<InvoiceItem> {
    const { data, error } = await this.supabase
      .from('invoice_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (error) {
      console.error('Failed to fetch invoice item:', error)
      throw new Error(`Failed to fetch invoice item: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new invoice item
   */
  async createInvoiceItem(itemData: InvoiceItemCreateData): Promise<InvoiceItem> {
    // Calculate totals
    const quantity = itemData.quantity || 1
    const unitPrice = itemData.unit_price || 0
    const unitCost = itemData.unit_cost || 0
    const discount = itemData.invoice_specific_discount || 0

    const totalPrice = quantity * unitPrice - discount
    const totalCost = unitCost > 0 ? quantity * unitCost : null

    // Prepare the payload
    const payload: Partial<InvoiceItem> = {
      invoice_id: itemData.invoice_id,
      shop_id: itemData.shop_id,
      work_order_item_id: itemData.work_order_item_id || null,
      item_type: itemData.item_type,
      description: itemData.description,
      part_number: itemData.part_number || null,
      supplier: itemData.supplier || null,
      category: itemData.category || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      unit_cost: unitCost > 0 ? unitCost : null,
      total_cost: totalCost,
      labor_hours: itemData.labor_hours || null,
      technician_id: itemData.technician_id || null,
      is_from_work_order: itemData.is_from_work_order || false,
      is_modified: false,
      original_work_order_item: itemData.original_work_order_item || null,
      invoice_specific_notes: itemData.invoice_specific_notes || null,
      invoice_specific_discount: discount,
      warranty_period: itemData.warranty_period || null,
      active: true,
    }

    const { data, error } = await this.supabase
      .from('invoice_items')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Failed to create invoice item:', error)
      throw new Error(`Failed to create invoice item: ${error.message}`)
    }

    return data
  }

  /**
   * Update an invoice item
   */
  async updateInvoiceItem(
    itemId: string,
    updates: InvoiceItemUpdateData
  ): Promise<InvoiceItem> {
    // Recalculate totals if quantity or unit_price changed
    let payload: any = { ...updates, updated_at: new Date().toISOString() }

    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      const currentItem = await this.getInvoiceItem(itemId)
      const quantity = updates.quantity ?? currentItem.quantity
      const unitPrice = updates.unit_price ?? currentItem.unit_price
      const discount = updates.invoice_specific_discount ?? currentItem.invoice_specific_discount ?? 0

      payload.total_price = quantity * unitPrice - discount

      if (updates.unit_cost !== undefined || currentItem.unit_cost) {
        const unitCost = updates.unit_cost ?? currentItem.unit_cost ?? 0
        payload.total_cost = unitCost > 0 ? quantity * unitCost : null
      }

      // Mark as modified if it came from a work order
      if (currentItem.is_from_work_order) {
        payload.is_modified = true
      }
    }

    const { data, error } = await this.supabase
      .from('invoice_items')
      .update(payload)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Failed to update invoice item:', error)
      throw new Error(`Failed to update invoice item: ${error.message}`)
    }

    return data
  }

  /**
   * Soft delete an invoice item
   */
  async deleteInvoiceItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('invoice_items')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      console.error('Failed to delete invoice item:', error)
      throw new Error(`Failed to delete invoice item: ${error.message}`)
    }
  }

  /**
   * Hard delete an invoice item (permanent)
   */
  async permanentlyDeleteInvoiceItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('invoice_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Failed to permanently delete invoice item:', error)
      throw new Error(`Failed to permanently delete invoice item: ${error.message}`)
    }
  }

  /**
   * Import items from a work order
   */
  async importWorkOrderItems(
    invoiceId: string,
    shopId: string,
    workOrderItems: WorkOrderItemImport[]
  ): Promise<InvoiceItem[]> {
    const itemsToCreate: InvoiceItemCreateData[] = workOrderItems.map((woItem) => ({
      invoice_id: invoiceId,
      shop_id: shopId,
      work_order_item_id: woItem.work_order_item_id,
      item_type: woItem.item_type,
      description: woItem.description,
      part_number: woItem.part_number,
      supplier: woItem.supplier,
      category: woItem.category,
      quantity: woItem.quantity,
      unit_price: woItem.unit_price,
      unit_cost: woItem.unit_cost,
      labor_hours: woItem.labor_hours,
      technician_id: woItem.technician_id,
      is_from_work_order: true,
      original_work_order_item: woItem,
    }))

    const createdItems: InvoiceItem[] = []

    for (const itemData of itemsToCreate) {
      try {
        const item = await this.createInvoiceItem(itemData)
        createdItems.push(item)
      } catch (error) {
        console.error('Failed to import work order item:', error)
        // Continue with other items even if one fails
      }
    }

    return createdItems
  }

  /**
   * Calculate invoice summary from items
   */
  async calculateInvoiceSummary(invoiceId: string): Promise<InvoiceItemSummary> {
    const items = await this.getInvoiceItems(invoiceId)

    const summary: InvoiceItemSummary = {
      subtotal: 0,
      partsTotal: 0,
      laborTotal: 0,
      servicesTotal: 0,
      feesTotal: 0,
      totalDiscount: 0,
      tax: 0,
      grandTotal: 0,
      itemCount: items.length,
      laborHoursTotal: 0,
    }

    items.forEach((item) => {
      const itemTotal = item.total_price || 0
      summary.subtotal += itemTotal

      switch (item.item_type) {
        case 'part':
          summary.partsTotal += itemTotal
          break
        case 'labor':
          summary.laborTotal += itemTotal
          summary.laborHoursTotal += item.labor_hours || 0
          break
        case 'service':
          summary.servicesTotal += itemTotal
          break
        case 'fee':
          summary.feesTotal += itemTotal
          break
      }

      summary.totalDiscount += item.invoice_specific_discount || 0
    })

    // Calculate tax (assuming 13% - can be configurable)
    summary.tax = summary.subtotal * 0.13
    summary.grandTotal = summary.subtotal + summary.tax

    return summary
  }

  /**
   * Duplicate an invoice item
   */
  async duplicateInvoiceItem(itemId: string): Promise<InvoiceItem> {
    const originalItem = await this.getInvoiceItem(itemId)

    const duplicateData: InvoiceItemCreateData = {
      invoice_id: originalItem.invoice_id,
      shop_id: originalItem.shop_id,
      item_type: originalItem.item_type,
      description: `${originalItem.description} (Copy)`,
      part_number: originalItem.part_number || undefined,
      supplier: originalItem.supplier || undefined,
      category: originalItem.category || undefined,
      quantity: originalItem.quantity,
      unit_price: originalItem.unit_price,
      unit_cost: originalItem.unit_cost || undefined,
      labor_hours: originalItem.labor_hours || undefined,
      technician_id: originalItem.technician_id || undefined,
      invoice_specific_notes: originalItem.invoice_specific_notes || undefined,
      invoice_specific_discount: originalItem.invoice_specific_discount || undefined,
      warranty_period: originalItem.warranty_period || undefined,
      is_from_work_order: false, // Duplicates are not from work orders
    }

    return this.createInvoiceItem(duplicateData)
  }

  /**
   * Restore an invoice item to its original work order values
   */
  async restoreToOriginal(itemId: string): Promise<InvoiceItem> {
    const item = await this.getInvoiceItem(itemId)

    if (!item.is_from_work_order || !item.original_work_order_item) {
      throw new Error('This item was not imported from a work order')
    }

    const original = item.original_work_order_item

    const updates: InvoiceItemUpdateData = {
      description: original.description,
      quantity: original.quantity,
      unit_price: original.unit_price,
      unit_cost: original.unit_cost,
      labor_hours: original.labor_hours,
      part_number: original.part_number,
      supplier: original.supplier,
      category: original.category,
      is_modified: false,
    }

    return this.updateInvoiceItem(itemId, updates)
  }

  /**
   * Bulk update invoice items
   */
  async bulkUpdateItems(
    items: Array<{ id: string; updates: InvoiceItemUpdateData }>
  ): Promise<InvoiceItem[]> {
    const updatedItems: InvoiceItem[] = []

    for (const { id, updates } of items) {
      try {
        const updated = await this.updateInvoiceItem(id, updates)
        updatedItems.push(updated)
      } catch (error) {
        console.error(`Failed to update item ${id}:`, error)
      }
    }

    return updatedItems
  }
}

export const invoiceItemsService = new InvoiceItemsService()
export default invoiceItemsService

