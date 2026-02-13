import { KANBAN_COLUMNS_CONFIG } from '../../constants/work-orders'
import type { WorkOrderWithDetails, WorkOrderKanbanItem, WorkOrderKanbanColumn } from '../../../types/work-order'

/**
 * Work Order Transformers
 * Pure functions for transforming work order data
 */

/**
 * Transform a WorkOrderWithDetails to a WorkOrderKanbanItem
 */
export function transformWorkOrderToKanbanItem(workOrder: WorkOrderWithDetails): WorkOrderKanbanItem {
    // Format customer display - handle walk-in customers
    let customerDisplay: string
    if (workOrder.customer_type === 'walk_in') {
        customerDisplay = 'Walk-in Customer'
    } else if (workOrder.customer) {
        customerDisplay = workOrder.customer.customer_name
    } else {
        customerDisplay = 'Unknown Customer'
    }

    // Format vehicle display - handle walk-in vehicles
    let vehicleDisplay: string
    if (workOrder.customer_type === 'walk_in' && workOrder.walk_in_vehicle_info) {
        const info = workOrder.walk_in_vehicle_info
        const hasLicensePlate = info.license_plate && 
                                info.license_plate !== 'NULL' && 
                                info.license_plate !== null &&
                                typeof info.license_plate === 'string' &&
                                info.license_plate.trim() !== ''
        vehicleDisplay = `${info.year} ${info.make} ${info.model}${hasLicensePlate ? ` (${info.license_plate})` : ''}`
    } else if (workOrder.vehicle) {
        const hasLicensePlate = workOrder.vehicle.license_plate && 
                                workOrder.vehicle.license_plate !== 'NULL' && 
                                workOrder.vehicle.license_plate !== null &&
                                typeof workOrder.vehicle.license_plate === 'string' &&
                                workOrder.vehicle.license_plate.trim() !== ''
        vehicleDisplay = `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}${hasLicensePlate ? ` (${workOrder.vehicle.license_plate})` : ''}`
    } else {
        vehicleDisplay = 'Unknown Vehicle'
    }

    // Format technician display
    const technicianDisplay = workOrder.technician
        ? `${workOrder.technician.first_name} ${workOrder.technician.last_name || ''}`
        : workOrder.assigned_technician_id || 'Unassigned'

    // Normalize status_tracker to array (handle both old format single object and new format array)
    const normalizeStatusTracker = (tracker: any): any[] | null => {
        if (!tracker) return null
        if (Array.isArray(tracker)) return tracker
        // Handle old format: single object
        if (tracker && typeof tracker === 'object' && tracker.name && tracker.color) {
            return [tracker]
        }
        return null
    }

    // Get first work order item (if available) - only labor, service, or part (exclude fee and expense)
    // Sort by created_at ascending to get the first one added
    let firstItem = null
    if ((workOrder as any).work_order_items && Array.isArray((workOrder as any).work_order_items) && (workOrder as any).work_order_items.length > 0) {
        // Filter to only labor, service, or part
        const validItems = (workOrder as any).work_order_items.filter((item: any) => 
            item.item_type === 'labor' || item.item_type === 'service' || item.item_type === 'part'
        )
        
        if (validItems.length > 0) {
            // Sort by created_at ascending to get the first one added
            const sortedItems = [...validItems].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
                return dateA - dateB
            })
            firstItem = {
                item_type: sortedItems[0].item_type,
                description: sortedItems[0].description
            }
        }
    }

    return {
        id: workOrder.id,
        title: workOrder.title,
        description: workOrder.description,
        status: workOrder.status,
        priority: workOrder.priority,
        assignee: technicianDisplay,
        date: workOrder.created_at.split('T')[0],
        customer: customerDisplay,
        customer_phone: workOrder.customer?.customer_phone,
        vehicle: vehicleDisplay,
        tags: workOrder.tags || [],
        shop_id: workOrder.shop_id,
        status_tracker: normalizeStatusTracker(workOrder.status_tracker),
        first_item: firstItem
    }
}

/**
 * Transform an array of WorkOrderWithDetails to WorkOrderKanbanColumn[]
 * Groups work orders by their status into kanban columns based on KANBAN_COLUMNS_CONFIG
 */
export function transformWorkOrdersToKanbanColumns(
    workOrders: WorkOrderWithDetails[]
): WorkOrderKanbanColumn[] {
    if (!workOrders) return []

    return KANBAN_COLUMNS_CONFIG.map((columnConfig) => {
        // Filter work orders that match this column's statuses
        const statusesArray = columnConfig.statuses as readonly string[]
        let filteredWorkOrders = workOrders.filter((wo) =>
            statusesArray.includes(wo.status)
        )

        // Sort completed column by completed_at (most recent first), others by created_at
        if (columnConfig.id === 'completed') {
            filteredWorkOrders = filteredWorkOrders.sort((a, b) => {
                // If both have completed_at, sort by completed_at descending (most recent first)
                if (a.completed_at && b.completed_at) {
                    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
                }
                // If only one has completed_at, prioritize it
                if (a.completed_at && !b.completed_at) return -1
                if (!a.completed_at && b.completed_at) return 1
                // If neither has completed_at, fall back to created_at descending
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
        } else {
            // For other columns, sort by created_at descending (most recent first)
            filteredWorkOrders = filteredWorkOrders.sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
        }

        return {
            id: columnConfig.id,
            title: columnConfig.title,
            color: columnConfig.color,
            items: filteredWorkOrders.map(transformWorkOrderToKanbanItem)
        }
    })
}

