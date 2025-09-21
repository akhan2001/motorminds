// Invoice type definitions - optimized for new work order system

export interface Invoice {
    invoice_number: string
    work_order_id?: string
    status: "PAID" | "UNPAID"
    amount: number
    issue_date: string
    shop_id: string
    customer_id: string
    vehicle_id: string
    labour_total_price?: number
    parts_total_price?: number
    labour_items?: any[]
    parts_items?: any[]
    created_at?: string
    paid_at?: string
    source: "customer_generated" | "shop_generated"
    notes?: string
    description?: string
}

export interface InvoiceFormData {
    work_order_id: string
    customer_id: string
    vehicle_id: string
    shop_id: string
    amount: number
    labour_total_price?: number
    parts_total_price?: number
    status: "PAID" | "UNPAID"
    source: "customer_generated" | "shop_generated"
    notes?: string
    description?: string
}

export interface InvoiceItem {
    id?: string
    invoice_id?: string
    work_order_item_id?: string
    item_type: 'labor' | 'part' | 'service' | 'fee'
    description: string
    part_number?: string
    quantity: number
    unit_price: number
    total_price: number
    category?: string
    notes?: string
}

export type InvoiceStatus = "PAID" | "UNPAID"
export type InvoiceSource = "customer_generated" | "shop_generated"
