export interface StagingInvoice {
    id: string
    invoice_number: string | null
    customer_identifier: string | null
    vehicle_identifier: string | null
    shop_identifier: string | null
    invoice_date: string | null
    due_date: string | null
    paid_date: string | null
    status: string | null
    payment_method: string | null
    subtotal: number | null
    tax_rate: number | null
    tax_amount: number | null
    discount_amount: number | null
    total_amount: number | null
    labor_total: number | null
    parts_total: number | null
    services_total: number | null
    fees_total: number | null
    invoice_items: any | null
    custom_fields: any | null
    notes: string | null
    matched_customer_id: string | null
    matched_vehicle_id: string | null
    matched_shop_id: string | null
    import_status: 'pending' | 'approved' | 'rejected' | 'migrated'
    import_batch_id: string | null
    validation_errors: string[] | null
    created_at: string
    shop_id: string | null
    customer_id: string | null
}

export interface StagingCustomer {
    id: string
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
    customer_address: string | null
    license_plate: string | null
    customer_source: string | null
    shop_id: string | null
    created_at: string
    updated_at: string | null
    import_status: 'pending' | 'approved' | 'rejected' | 'migrated'
    import_batch_id: string | null
    validation_errors: string[] | null
    duplicate_of: string | null
}
