import { PartsRequestStatus } from './status'

export interface VehicleInfo {
    year?: string | number
    make?: string
    model?: string
    vin?: string
    engine?: string
    mileage?: string | number
    transmission?: string
    color?: string
    trim?: string
    drivetrain?: string
    fuel_type?: string
    body_style?: string
}

export interface PartItem {
    part_name?: string
    partName?: string
    part_number?: string
    partNumber?: string
    quantity?: number
    description?: string
    estimated_price?: number
    supplier_part_number?: string
    brand?: string
    availability?: string
}

export interface QuoteDetails {
    price?: number | string
    availability?: string
    delivery_time?: string
    part_number?: string
    contact_name?: string
    total_cost?: string
}

export interface QuoteReceived {
    price?: number | string
    quote_details?: QuoteDetails
}

export interface SupplierInfo {
    total_suppliers?: number
    completed_suppliers?: number
    failed_suppliers?: number
    selected_suppliers?: Array<{
        id: string
        name: string
        phone: string
    }>
}

export interface CallAnalysis {
    successEvaluation?: boolean
    call_outcome?: {
        status?: string
        reason?: string
    }
}

export interface PartsRequest {
    id: string
    created_at: string
    updated_at?: string
    shop_id: string
    user_id?: string
    vehicle_info: VehicleInfo
    parts_requested: PartItem[]
    total_estimated_price?: number
    status: PartsRequestStatus
    priority: 'low' | 'normal' | 'high' | 'urgent'
    notes?: string
    customer_notes?: string
    assigned_to?: string
    admin_notes?: string
    quote_provided?: QuoteReceived
    actual_cost?: number
    supplier_info?: SupplierInfo
    order_placed_at?: string
    estimated_delivery?: string
    fulfilled_at?: string
    customer_id?: string
    vehicle_id?: string
    call_analysis?: CallAnalysis
    voice_call_id?: string
    availableActions?: any[]
    [key: string]: any // Allow additional properties from database
}

