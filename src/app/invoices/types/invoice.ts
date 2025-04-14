export interface VehicleInformation {
    year?: string
    make?: string
    model?: string
    license_plate?: string
}

export interface Invoice {
    invoice_number: string
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
    workorder_id?: string
    description?: string
    labour?: string
    labour_cost?: number
    parts?: string
    parts_cost?: number
    notes?: string
    mileage?: string
    assigned_to?: string
    vehicle_information?: VehicleInformation
} 