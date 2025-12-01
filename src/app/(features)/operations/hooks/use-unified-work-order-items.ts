/**
 * Custom hook for managing unified work order items state
 * This hook provides a clean interface for working with the new unified item system
 */

import { useState, useCallback, useMemo } from 'react'
import { UnifiedFormItem, calculateTotalPrice, formItemToWorkOrderItem } from '../types/work-order-item-form'
import { WorkOrderItemType, WorkOrderItem, WorkOrderItemFormData } from '../types/work-order-items'
import { WorkOrderItemTemplate } from '../types/work-order-item-templates'

export interface UnifiedItemsState {
  items: UnifiedFormItem[]
  getItemsByType: (itemType: WorkOrderItemType) => UnifiedFormItem[]
  updateItemsByType: (itemType: WorkOrderItemType, updatedItems: UnifiedFormItem[]) => void
  addItem: (item: UnifiedFormItem) => void
  addItemFromTemplate: (template: WorkOrderItemTemplate) => void
  addItemFromExisting: (existingItem: WorkOrderItem) => void
  removeItem: (itemId: string) => void
  updateItem: (itemId: string, updates: Partial<UnifiedFormItem>) => void
  clearItemsByType: (itemType: WorkOrderItemType) => void
  clearAllItems: () => void
  getTotalsByType: () => Record<WorkOrderItemType, number>
  getGrandTotal: () => number
  getItemCount: () => number
  getItemCountByType: (itemType: WorkOrderItemType) => number
  toWorkOrderItemsData: () => WorkOrderItemFormData[]
  loadFromWorkOrderItems: (workOrderItems: WorkOrderItem[]) => void
}

export function useUnifiedWorkOrderItems(
  initialItems: UnifiedFormItem[] = []
): UnifiedItemsState {
  const [items, setItems] = useState<UnifiedFormItem[]>(initialItems)

  /**
   * Get all items of a specific type
   */
  const getItemsByType = useCallback((itemType: WorkOrderItemType): UnifiedFormItem[] => {
    return items.filter(item => item.item_type === itemType)
  }, [items])

  /**
   * Update all items of a specific type
   */
  const updateItemsByType = useCallback((itemType: WorkOrderItemType, updatedItems: UnifiedFormItem[]) => {
    setItems(prev => [
      ...prev.filter(item => item.item_type !== itemType),
      ...updatedItems
    ])
  }, [])

  /**
   * Add a single item
   */
  const addItem = useCallback((item: UnifiedFormItem) => {
    setItems(prev => [...prev, item])
  }, [])

  /**
   * Add an item from a template
   */
  const addItemFromTemplate = useCallback((template: WorkOrderItemTemplate) => {
    const newItem: UnifiedFormItem = {
      id: crypto.randomUUID(),
      item_type: template.item_type,
      description: template.name,
      quantity: template.quantity || 1,
      unit_price: template.unit_price || 0,
      total_price: 0, // Will be calculated below
      unit_cost: template.unit_cost,
      labor_hours: template.labor_hours,
      part_number: template.part_number,
      supplier: template.supplier,
      warranty_period: template.warranty_period,
      category: template.category,
      notes: template.description,
      isNew: true,
      hasChanges: false
    }

    // Calculate total price
    newItem.total_price = calculateTotalPrice(newItem)

    setItems(prev => [...prev, newItem])
  }, [])

  /**
   * Add an item from an existing work order item
   */
  const addItemFromExisting = useCallback((existingItem: WorkOrderItem) => {
    const newItem: UnifiedFormItem = {
      id: crypto.randomUUID(), // Generate new ID for form
      item_type: existingItem.item_type,
      description: existingItem.description,
      quantity: existingItem.quantity,
      unit_price: existingItem.unit_price,
      total_price: existingItem.total_price,
      unit_cost: existingItem.unit_cost,
      labor_hours: existingItem.labor_hours,
      technician_id: existingItem.technician_id,
      part_number: existingItem.part_number,
      supplier: existingItem.supplier,
      warranty_period: existingItem.warranty_period,
      category: existingItem.category,
      notes: existingItem.notes,
      isNew: true,
      hasChanges: false
    }

    setItems(prev => [...prev, newItem])
  }, [])

  /**
   * Remove a single item by ID
   */
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  /**
   * Update a single item
   */
  const updateItem = useCallback((itemId: string, updates: Partial<UnifiedFormItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item

      const updatedItem = { ...item, ...updates, hasChanges: true }

      // Recalculate total price if quantity, unit_price, or labor_hours changed
      if ('quantity' in updates || 'unit_price' in updates || 'labor_hours' in updates) {
        updatedItem.total_price = calculateTotalPrice(updatedItem)
      }

      return updatedItem
    }))
  }, [])

  /**
   * Clear all items of a specific type
   */
  const clearItemsByType = useCallback((itemType: WorkOrderItemType) => {
    setItems(prev => prev.filter(item => item.item_type !== itemType))
  }, [])

  /**
   * Clear all items
   */
  const clearAllItems = useCallback(() => {
    setItems([])
  }, [])

  /**
   * Get totals grouped by item type
   */
  const getTotalsByType = useCallback((): Record<WorkOrderItemType, number> => {
    return items.reduce((acc, item) => {
      const type = item.item_type
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type] += item.total_price
      return acc
    }, {} as Record<WorkOrderItemType, number>)
  }, [items])

  /**
   * Get grand total (sum of all items, with discounts subtracted)
   */
  const getGrandTotal = useCallback((): number => {
    return items.reduce((total, item) => {
      // Discounts should subtract from the total
      if (item.item_type === 'discount') {
        return total - Math.abs(item.total_price)
      }
      return total + item.total_price
    }, 0)
  }, [items])

  /**
   * Get total item count
   */
  const getItemCount = useCallback((): number => {
    return items.length
  }, [items])

  /**
   * Get item count for a specific type
   */
  const getItemCountByType = useCallback((itemType: WorkOrderItemType): number => {
    return items.filter(item => item.item_type === itemType).length
  }, [items])

  /**
   * Convert all items to WorkOrderItemFormData for API submission
   */
  const toWorkOrderItemsData = useCallback((): WorkOrderItemFormData[] => {
    return items.map(formItemToWorkOrderItem)
  }, [items])

  /**
   * Load items from existing work order items (e.g., when editing)
   */
  const loadFromWorkOrderItems = useCallback((workOrderItems: WorkOrderItem[]) => {
    const formItems: UnifiedFormItem[] = workOrderItems.map(item => ({
      id: item.id,
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      unit_cost: item.unit_cost,
      labor_hours: item.labor_hours,
      technician_id: item.technician_id,
      part_number: item.part_number,
      supplier: item.supplier,
      warranty_period: item.warranty_period,
      category: item.category,
      notes: item.notes,
      isNew: false,
      hasChanges: false
    }))

    setItems(formItems)
  }, [])

  return {
    items,
    getItemsByType,
    updateItemsByType,
    addItem,
    addItemFromTemplate,
    addItemFromExisting,
    removeItem,
    updateItem,
    clearItemsByType,
    clearAllItems,
    getTotalsByType,
    getGrandTotal,
    getItemCount,
    getItemCountByType,
    toWorkOrderItemsData,
    loadFromWorkOrderItems
  }
}

/**
 * Helper hook for financial calculations
 */
export function useWorkOrderItemFinancials(itemsState: UnifiedItemsState) {
  const totals = useMemo(() => {
    const byType = itemsState.getTotalsByType()

    return {
      labor: byType.labor || 0,
      parts: byType.part || 0,
      services: byType.service || 0,
      fees: byType.fee || 0,
      discounts: byType.discount || 0,
      packages: byType.package || 0,
      subtotal: (byType.labor || 0) +
                (byType.part || 0) +
                (byType.service || 0) +
                (byType.fee || 0) +
                (byType.package || 0),
      total: itemsState.getGrandTotal()
    }
  }, [itemsState])

  return totals
}
