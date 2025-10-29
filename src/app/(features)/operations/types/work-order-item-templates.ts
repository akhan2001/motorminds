export interface WorkOrderItemTemplate {
    id: string
    shop_id: string
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'
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
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'
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
    item_type?: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'
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
    item_type: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'
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

// Labor card - includes labor-specific fields
export interface WorkOrderLaborCard {
    item_type: 'labor'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    category: string
    labor_hours: number
}

// Part card - includes part-specific fields
export interface WorkOrderPartCard {
    item_type: 'part'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    part_number: string
    supplier: string
    category: string
    warranty_period: string
}

// Service card - includes service-specific fields
export interface WorkOrderServiceCard {
    item_type: 'service'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    category: string
    labor_hours?: number
}

// Fee card - includes fee-specific fields
export interface WorkOrderFeeCard {
    item_type: 'fee'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    category: string
}

// Discount card - includes discount-specific fields
export interface WorkOrderDiscountCard {
    item_type: 'discount'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    category: string
}

// Package card - includes package-specific fields
export interface WorkOrderPackageCard {
    item_type: 'package'
    name: string
    description: string
    quantity: number
    unit_price: number
    unit_cost?: number
    category: string
    labor_hours?: number
    // Package-specific fields
    included_services?: string[]
    package_validity?: string
}