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
        vehicleDisplay = `${info.year} ${info.make} ${info.model}${info.license_plate ? ` (${info.license_plate})` : ''}`
    } else if (workOrder.vehicle) {
        vehicleDisplay = `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}${workOrder.vehicle.license_plate ? ` (${workOrder.vehicle.license_plate})` : ''}`
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
        status_tracker: normalizeStatusTracker(workOrder.status_tracker)
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
        const filteredWorkOrders = workOrders.filter((wo) =>
            columnConfig.statuses.includes(wo.status as any)
        )

        return {
            id: columnConfig.id,
            title: columnConfig.title,
            color: columnConfig.color,
            items: filteredWorkOrders.map(transformWorkOrderToKanbanItem)
        }
    })
}

