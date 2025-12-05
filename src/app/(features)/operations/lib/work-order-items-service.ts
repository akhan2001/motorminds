// Work Order Items service for API interactions
import { createClient } from '@/utils/supabase/client'
import type { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData, WorkOrderItemSummary } from '../types/work-order-items'

const supabase = createClient()

export class WorkOrderItemsService {

    /**
     * Get all items for a specific work order
     */
    static async getWorkOrderItems(workOrderId: string): Promise<WorkOrderItem[]> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching work order items:', error)
            throw new Error(`Failed to fetch work order items: ${error.message}`)
        }

        return data || []
    }

    static async getWorkOrderItemsByShopId(shopId: string): Promise<WorkOrderItem[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching work order items:', error)
            throw new Error(`Failed to fetch work order items: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get a single work order item by ID
     */
    static async getWorkOrderItem(itemId: string): Promise<WorkOrderItem> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('id', itemId)
            .single()

        if (error) {
            // PGRST116 is "not found" - don't log as error since it's expected in some flows
            if (error.code === 'PGRST116') {
                throw new Error(`Work order item with ID ${itemId} not found`)
            }
            // Only log unexpected errors
            console.error('Error fetching work order item:', error)
            throw new Error(`Failed to fetch work order item: ${error.message}`)
        }

        return data
    }

    /**
     * Create a new work order item
     */
    static async createWorkOrderItem(itemData: WorkOrderItemCreateData): Promise<WorkOrderItem> {
        if (!itemData.work_order_id) {
            throw new Error('Work Order ID is required')
        }

        if (!itemData.description?.trim()) {
            throw new Error('Description is required')
        }

        if (itemData.quantity <= 0) {
            throw new Error('Quantity must be greater than 0')
        }

        if (itemData.unit_price < 0) {
            throw new Error('Unit price cannot be negative')
        }

        // Validate unit_price is properly set
        if (itemData.unit_price === null || itemData.unit_price === undefined) {
            throw new Error('Unit price is required')
        }

        // Calculate total price
        const totalPrice = itemData.quantity * itemData.unit_price
        const totalCost = itemData.unit_cost ? itemData.quantity * itemData.unit_cost : undefined

        // Get shop_id from the work order (required for RLS)
        const { data: workOrder, error: workOrderError } = await supabase
            .from('work_orders')
            .select('shop_id')
            .eq('id', itemData.work_order_id)
            .single()

        if (workOrderError || !workOrder) {
            throw new Error('Work order not found')
        }

        const itemPayload = {
            work_order_id: itemData.work_order_id,
            shop_id: workOrder.shop_id,
            item_type: itemData.item_type,
            description: itemData.description.trim(),
            part_number: itemData.part_number?.trim() || null,
            quantity: itemData.quantity,
            unit_price: itemData.unit_price,
            total_price: totalPrice,
            unit_cost: itemData.unit_cost || null,
            total_cost: totalCost || null,
            supplier: itemData.supplier?.trim() || null,
            category: itemData.category?.trim() || null,
            warranty_period: itemData.warranty_period?.trim() || null,
            notes: itemData.notes?.trim() || null,
            labor_hours: itemData.labor_hours || null,
            technician_id: itemData.technician_id || null,
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .insert([itemPayload])
            .select()
            .single()

        if (error) {
            console.error('Error creating work order item:', error)
            throw new Error(`Failed to create work order item: ${error.message}`)
        }

        return data
    }

    /**
     * Update an existing work order item
     */
    static async updateWorkOrderItem(itemId: string, itemData: Partial<WorkOrderItemFormData>): Promise<WorkOrderItem> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        const updatePayload: any = {}

        if (itemData.item_type !== undefined) updatePayload.item_type = itemData.item_type
        if (itemData.description !== undefined) {
            if (!itemData.description.trim()) {
                throw new Error('Description cannot be empty')
            }
            updatePayload.description = itemData.description.trim()
        }
        if (itemData.part_number !== undefined) updatePayload.part_number = itemData.part_number?.trim() || null
        if (itemData.quantity !== undefined) {
            if (itemData.quantity <= 0) {
                throw new Error('Quantity must be greater than 0')
            }
            updatePayload.quantity = itemData.quantity
        }
        if (itemData.unit_price !== undefined) {
            if (itemData.unit_price < 0) {
                throw new Error('Unit price cannot be negative')
            }
            updatePayload.unit_price = itemData.unit_price
        }

        // Recalculate total price if quantity or unit_price changed
        if (itemData.quantity !== undefined || itemData.unit_price !== undefined || itemData.labor_hours !== undefined) {
            // Get current item to get missing values
            try {
                const currentItem = await this.getWorkOrderItem(itemId)
                const newQuantity = itemData.quantity ?? currentItem.quantity
                const newUnitPrice = itemData.unit_price ?? currentItem.unit_price
                const newLaborHours = itemData.labor_hours ?? currentItem.labor_hours
                
                // Validate unit_price is not null/undefined
                if (newUnitPrice === null || newUnitPrice === undefined) {
                    throw new Error('Unit price cannot be null or undefined')
                }
                
                // Calculate based on item type
                if (currentItem.item_type === 'labor') {
                    updatePayload.total_price = (newLaborHours || 0) * newUnitPrice
                } else {
                    updatePayload.total_price = newQuantity * newUnitPrice
                }
                
                // Ensure unit_price is stored if it was calculated
                if (itemData.unit_price === undefined && currentItem.unit_price !== newUnitPrice) {
                    updatePayload.unit_price = newUnitPrice
                }
            } catch (error) {
                console.error('Error fetching current item for price calculation:', error)
                // If item doesn't exist, we can't update it
                throw new Error(`Work order item with ID ${itemId} not found`)
            }
        }

        if (itemData.supplier !== undefined) updatePayload.supplier = itemData.supplier?.trim() || null
        if (itemData.category !== undefined) updatePayload.category = itemData.category?.trim() || null
        if (itemData.warranty_period !== undefined) updatePayload.warranty_period = itemData.warranty_period?.trim() || null
        if (itemData.notes !== undefined) updatePayload.notes = itemData.notes?.trim() || null
        if (itemData.labor_hours !== undefined) updatePayload.labor_hours = itemData.labor_hours || null
        if (itemData.technician_id !== undefined) updatePayload.technician_id = itemData.technician_id || null
        if (itemData.active !== undefined) updatePayload.active = itemData.active

        const { data, error } = await supabase
            .from('work_order_items')
            .update(updatePayload)
            .eq('id', itemId)
            .select()
            .single()

        if (error) {
            console.error('Error updating work order item:', {
                error,
                itemId,
                updatePayload,
                errorCode: error.code,
                errorMessage: error.message,
                errorDetails: error.details,
                errorHint: error.hint
            })
            throw new Error(`Failed to update work order item: ${error.message || 'Unknown error'}`)
        }

        return data
    }

    /**
     * Delete a work order item
     */
    static async deleteWorkOrderItem(itemId: string): Promise<void> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        const { error } = await supabase
            .from('work_order_items')
            .delete()
            .eq('id', itemId)

        if (error) {
            console.error('Error deleting work order item:', error)
            throw new Error(`Failed to delete work order item: ${error.message}`)
        }
    }

    /**
     * Get summary of work order items (totals by type) - excludes rejected items
     */
    static async getWorkOrderItemsSummary(workOrderId: string): Promise<WorkOrderItemSummary> {
        const items = await this.getWorkOrderItems(workOrderId)

        // Filter out rejected items (active = false)
        const approvedItems = items.filter(item => item.active !== false)

        const summary = approvedItems.reduce((acc, item) => {
            // Calculate total based on item type
            let total = 0
            if (item.item_type === 'labor') {
                // For labor: labor_hours * unit_price
                total = (item.labor_hours || 0) * (item.unit_price || 0)
            } else {
                // For parts, services, fees, discounts, packages: quantity * unit_price
                total = (item.quantity || 0) * (item.unit_price || 0)
            }
            
            switch (item.item_type) {
                case 'labor':
                    acc.totalLabor += total
                    acc.grandTotal += total
                    break
                case 'part':
                    acc.totalParts += total
                    acc.grandTotal += total
                    break
                case 'service':
                    acc.totalServices += total
                    acc.grandTotal += total
                    break
                case 'fee':
                    acc.totalFees += total
                    acc.grandTotal += total
                    break
                case 'discount':
                    acc.totalDiscounts += total
                    acc.grandTotal -= total // Subtract discounts instead of adding
                    break
                case 'package':
                    acc.totalPackages += total
                    acc.grandTotal += total
                    break
            }
            acc.itemCount += 1
            
            return acc
        }, {
            totalLabor: 0,
            totalParts: 0,
            totalServices: 0,
            totalFees: 0,
            totalDiscounts: 0,
            totalPackages: 0,
            grandTotal: 0,
            itemCount: 0
        })

        return summary
    }

    /**
     * Duplicate items from one work order to another
     */
    static async duplicateWorkOrderItems(sourceWorkOrderId: string, targetWorkOrderId: string): Promise<WorkOrderItem[]> {
        const sourceItems = await this.getWorkOrderItems(sourceWorkOrderId)
        
        const duplicatedItems = await Promise.all(
            sourceItems.map(item => {
                const itemData: WorkOrderItemCreateData = {
                    work_order_id: targetWorkOrderId,
                    item_type: item.item_type,
                    description: item.description,
                    part_number: item.part_number,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    unit_cost: item.unit_cost,
                    supplier: item.supplier,
                    category: item.category,
                    warranty_period: item.warranty_period,
                    notes: item.notes,
                    labor_hours: item.labor_hours,
                    technician_id: item.technician_id,
                }
                
                return this.createWorkOrderItem(itemData)
            })
        )

        return duplicatedItems
    }

    /**
     * Mark work order item as completed
     */
    static async completeWorkOrderItem(itemId: string): Promise<WorkOrderItem> {
        const { data, error } = await supabase
            .from('work_order_items')
            .update({
                completed_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .select()
            .single()

        if (error) {
            console.error('Error completing work order item:', error)
            throw new Error(`Failed to complete work order item: ${error.message}`)
        }

        return data
    }

    /**
     * Check if a work order item exists by ID
     */
    static async workOrderItemExists(itemId: string): Promise<boolean> {
        if (!itemId) {
            return false
        }

        try {
            await this.getWorkOrderItem(itemId)
            return true
        } catch (error) {
            return false
        }
    }
}

export const workOrderItemsService = new WorkOrderItemsService()

// Export individual functions for easier importing
export const getWorkOrderItems = WorkOrderItemsService.getWorkOrderItems
export const getWorkOrderItem = WorkOrderItemsService.getWorkOrderItem
export const createWorkOrderItem = WorkOrderItemsService.createWorkOrderItem
export const updateWorkOrderItem = WorkOrderItemsService.updateWorkOrderItem
export const deleteWorkOrderItem = WorkOrderItemsService.deleteWorkOrderItem
export const getWorkOrderItemsSummary = WorkOrderItemsService.getWorkOrderItemsSummary
