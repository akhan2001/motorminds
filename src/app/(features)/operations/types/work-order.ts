// Work order type definitions - matches actual database schema
import type { StatusTracker } from './status-tracker'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

export interface WorkOrder {
    id: string
    work_order_number: string
    title: string
    description?: string
    status: WorkOrderStatus
    priority: WorkOrderPriority
    
    // Relationships
    shop_id: string
    customer_id?: string | null // null for walk-ins
    vehicle_id?: string | null // may be null or set for walk-ins
    appointment_id?: string | null
    invoice_id?: string | null
    assigned_technician_id?: string | null
    
    // New walk-in fields
    customer_type: 'registered' | 'walk_in'
    walk_in_vehicle_info?: WalkInVehicleInfo

    // Metadata
    tags?: string[]
    attachments?: any[]
    notes?: string
    status_tracker?: StatusTracker[] | null // JSONB column - array of status trackers (max 5)
    
    // Timestamps
    created_at: string
    updated_at: string
    started_at?: string
    completed_at?: string
}

// Work order with joined customer and vehicle details
export interface WorkOrderWithDetails extends WorkOrder {
    customer?: {
        id: string
        customer_name: string
        customer_phone?: string
        customer_email?: string
        customer_address?: string
    }
    vehicle?: {
        id: string
        year: number
        make: string
        model: string
        license_plate?: string
        color?: string
        vin?: string
        mileage?: number
    }
    technician?: {
        id: string
        first_name: string
        last_name: string
    }
}

export type WorkOrderStatus = 
    | 'pending'
    | 'approved' 
    | 'in_progress'
    | 'waiting_parts'
    | 'waiting_customer'
    | 'ready'
    | 'completed'
    | 'invoiced'
    | 'cancelled'
    | 'on_hold'

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface WorkOrderItem {
    id: string
    work_order_id: string
    shop_service_id?: string
    
    item_type: 'labor' | 'part' | 'service' | 'fee'
    description: string
    part_number?: string
    
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number
    total_cost?: number
    
    supplier?: string
    category?: string
    warranty_period?: string
    notes?: string
    
    labor_hours?: number
    technician_id?: string
    
    created_at: string
    completed_at?: string
}

// For Kanban board display
export interface WorkOrderKanbanItem {
    id: string
    title: string
    description?: string
    status: WorkOrderStatus
    priority: WorkOrderPriority
    assignee?: string
    date: string
    customer?: string
    vehicle?: string
    tags?: string[]
    shop_id?: string
    status_tracker?: StatusTracker[] | null // For display with border color - array of status trackers (max 5)
}

export interface WorkOrderKanbanColumn {
    id: string
    title: string
    items: WorkOrderKanbanItem[]
    color: string
}
