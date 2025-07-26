export interface VehicleInformation {
    year?: string
    make?: string
    model?: string
    license_plate?: string
}

export interface Invoice {
    invoice_number: string
    shop_id?: string
    display_id?: string
    status: "PAID" | "UNPAID"
    amount: number
    issue_date: string
    shop_name: string
    shop_address: string
    shop_email?: string
    shop_phone?: string
    client_name: string
    client_address?: string
    client_email?: string
    client_phone?: string
    customer_id?: string
    vehicle_id?: string
    labour_total_price?: number
    parts_total_price?: number
    paid_at?: string
    workorder_id?: string
    description?: string
    labour?: string
    notes?: string
    mileage?: string
    assigned_to?: string
    vehicle_information?: VehicleInformation
    source?: "customer_generated" | "shop_generated"
    estimated_amount?: number
    customer_notes?: string
} 