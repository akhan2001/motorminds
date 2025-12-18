import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

export interface Invoice {
    id: string
    invoice_number: string
    display_id: string | null
    work_order_id: string | null
    customer_id: string | null // null for walk-in customers
    vehicle_id: string | null
    shop_id: string
    title: string | null
    description: string | null
    status: InvoiceStatus
    priority: InvoicePriority
    subtotal: number
    tax_rate: number
    tax_amount: number
    discount_amount: number
    total_amount: number
    labor_total: number
    parts_total: number
    services_total: number
    fees_total: number
    invoice_items: InvoiceItem[]
    issue_date: string
    due_date: string | null
    paid_date: string | null
    payment_method: PaymentMethod | null
    payment_reference: string | null
    notes: string | null
    created_at: string
    updated_at: string
    
    // Walk-in customer support
    customer_type: 'registered' | 'walk_in'
    walk_in_vehicle_info?: WalkInVehicleInfo
}

export interface InvoiceItem {
    id: string
    item_type: ItemType
    description: string
    quantity: number
    unit_price: number
    total_price: number
    part_number?: string
    supplier?: string
    category?: string
    warranty_period?: string
    labor_hours?: number
    technician_id?: string
}

export interface InvoiceWithDetails extends Invoice {
    customer: {
        id: string
        customer_name: string
        customer_email: string | null
        customer_phone: string | null
        customer_address: string | null
    } | null // null for walk-in customers
    vehicle: {
        id: string
        year: number
        make: string
        model: string
        license_plate: string | null
    } | null
    work_order: {
        id: string
        work_order_number: string
        title: string
        status: string
    } | null
    shop?: {
        id: string
        shop_name: string
    } | null
    // Organization context properties
    isFromCurrentShop?: boolean
    shopName?: string
}

export interface InvoiceFormData {
    customer_id: string | null // null for walk-in customers
    vehicle_id: string | null
    work_order_id: string | null
    title: string | null
    description: string | null
    status: InvoiceStatus
    priority: InvoicePriority
    tax_rate: number
    discount_amount: number
    issue_date: string
    due_date: string | null
    // Optional: when the invoice was marked as paid
    paid_date?: string | null
    payment_method: PaymentMethod | null
    payment_reference: string | null
    notes: string | null
    invoice_items: InvoiceItem[]
    
    // Walk-in customer support
    customer_type: 'registered' | 'walk_in'
    walk_in_vehicle_info?: WalkInVehicleInfo
}

export type InvoiceStatus = 
    | 'draft'
    | 'sent'
    | 'viewed'
    | 'paid'
    | 'unpaid'
    | 'overdue'
    | 'cancelled'
    | 'refunded'

export type InvoicePriority = 
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent'

export type PaymentMethod = 
    | 'cash'
    | 'credit_card'
    | 'debit'
    | 'bank_transfer'
    | 'check'
    | 'other'

export type ItemType = 
    | 'labor'
    | 'part'
    | 'service'
    | 'fee'
    | 'discount'
    | 'package'

export interface InvoiceFilters {
    status?: InvoiceStatus[]
    priority?: InvoicePriority[]
    payment_method?: PaymentMethod[]
    date_from?: string
    date_to?: string
    amount_min?: number
    amount_max?: number
    customer_id?: string
    work_order_id?: string
}

export interface InvoiceStats {
    total_count: number
    draft_count: number
    sent_count: number
    paid_count: number
    overdue_count: number
    total_amount: number
    paid_amount: number
    outstanding_amount: number
}