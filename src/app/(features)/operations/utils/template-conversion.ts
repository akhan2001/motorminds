// Template to Work Order Item conversion utilities

import { WorkOrderItemTemplate } from '../types/work-order-item-templates'
import { WorkOrderItemCreateData } from '../types/work-order-items'

/**
 * Convert template item type to work order item type
 */
export function convertTemplateItemType(templateItemType: string): string {
    // Direct mapping - both tables support the same item types
    const supportedTypes = ['labor', 'part', 'service', 'fee', 'discount', 'package']
    
    return supportedTypes.includes(templateItemType) ? templateItemType : 'service'
}

/**
 * Convert template to work order item data
 */
export function convertTemplateToWorkOrderItem(
    template: WorkOrderItemTemplate,
    workOrderId: string,
    technicianId?: string,
    overrides?: Partial<WorkOrderItemCreateData>
): WorkOrderItemCreateData {
    const convertedItemType = convertTemplateItemType(template.item_type)
    const totalPrice = template.quantity * template.unit_price
    const totalCost = template.unit_cost ? template.quantity * template.unit_cost : undefined
    
    return {
        work_order_id: workOrderId,
        item_type: convertedItemType as any,
        description: template.name,
        part_number: template.part_number || undefined,
        quantity: template.quantity,
        unit_price: template.unit_price,
        unit_cost: template.unit_cost,
        supplier: template.supplier || undefined,
        category: template.category || undefined,
        warranty_period: template.warranty_period || undefined,
        notes: template.description || undefined,
        labor_hours: template.labor_hours || undefined,
        technician_id: technicianId,
        active: true,
        ...overrides
    }
}

/**
 * Get display name for item type
 */
export function getItemTypeDisplayName(itemType: string): string {
    const displayNames: Record<string, string> = {
        'labor': 'Labor',
        'part': 'Part',
        'service': 'Service',
        'fee': 'Fee',
        'discount': 'Discount',
        'package': 'Package'
    }
    
    return displayNames[itemType] || 'Service'
}

/**
 * Get item type color for UI
 */
export function getItemTypeColor(itemType: string): string {
    const colors: Record<string, string> = {
        'labor': 'bg-blue-100 text-blue-800',
        'part': 'bg-green-100 text-green-800',
        'service': 'bg-purple-100 text-purple-800',
        'fee': 'bg-yellow-100 text-yellow-800',
        'discount': 'bg-red-100 text-red-800',
        'package': 'bg-indigo-100 text-indigo-800'
    }
    
    return colors[itemType] || 'bg-gray-100 text-gray-800'
}

/**
 * Check if item type requires labor hours
 */
export function requiresLaborHours(itemType: string): boolean {
    return ['labor', 'service', 'package'].includes(itemType)
}

/**
 * Check if item type requires part number
 */
export function requiresPartNumber(itemType: string): boolean {
    return itemType === 'part'
}

/**
 * Check if item type requires supplier
 */
export function requiresSupplier(itemType: string): boolean {
    return itemType === 'part'
}

/**
 * Check if item type requires warranty period
 */
export function requiresWarrantyPeriod(itemType: string): boolean {
    return itemType === 'part'
}
