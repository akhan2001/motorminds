export interface WorkOrderItemTemplate {
    id: string
    shop_id: string
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'package'
    name: string
    description?: string
    quantity: number
    unit_price: number
    unit_cost?: number
    part_number?: string
    supplier?: string
    category?: string
    labor_hours?: number
    warranty_period?: string
    created_at: string
}

export interface WorkOrderItemTemplateCreateData {
    shop_id: string
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'package'
    name: string
    description?: string
    quantity: number
    unit_price: number
    unit_cost?: number
    part_number?: string
    supplier?: string
    category?: string
    labor_hours?: number
    warranty_period?: string
}

export interface WorkOrderItemTemplateUpdateData {
    item_type?: 'labor' | 'part' | 'service' | 'fee' | 'package'
    name?: string
    description?: string
    quantity?: number
    unit_price?: number
    unit_cost?: number
    part_number?: string
    supplier?: string
    category?: string
    labor_hours?: number
    warranty_period?: string
}

export interface CloneTemplateToWorkOrderData {
    template_id: string
    work_order_id: string
    technician_id?: string
    // Optional overrides
    quantity?: number
    unit_price?: number
    labor_hours?: number
    notes?: string
}

export interface WorkOrderItemTemplateFormData {
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'package'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost: number
    part_number: string
    supplier: string
    category: string
    labor_hours: number
    warranty_period: string
}
