// Customer domain types

// Re-export vehicle types
export * from './vehicle'

// Customer types (existing)
export interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone: string
    customer_address?: string
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email: string
    }
}
