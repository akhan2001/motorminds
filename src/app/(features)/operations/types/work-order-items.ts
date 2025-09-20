// Work order items type definitions - matches actual database schema

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

export type WorkOrderItemType = 'labor' | 'part' | 'service' | 'fee'

export interface WorkOrderItemFormData {
    item_type: WorkOrderItemType
    description: string
    part_number?: string
    quantity: number
    unit_price: number
    unit_cost?: number
    supplier?: string
    category?: string
    warranty_period?: string
    notes?: string
    labor_hours?: number
    technician_id?: string
}

export interface WorkOrderItemCreateData extends WorkOrderItemFormData {
    work_order_id: string
}

export interface WorkOrderItemSummary {
    totalLabor: number
    totalParts: number
    totalServices: number
    totalFees: number
    grandTotal: number
    itemCount: number
}