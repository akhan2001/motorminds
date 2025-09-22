/**
 * Parts Request Types
 * Type definitions for parts request functionality
 */

// Database enum types
export type PartsRequestStatus = 'pending' | 'quoted' | 'ordered' | 'fulfilled' | 'cancelled'
export type PartsRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

// Vehicle information interface
export interface VehicleInfo {
    year?: string
    make?: string
    model?: string
    vin?: string
    mileage?: string
    engine?: string
    trim?: string
    color?: string
    transmission?: string
    drivetrain?: string
    fuel_type?: string
    body_style?: string
}

// Part item interface
export interface PartItem {
    partName: string
    partNumber?: string
    quantity: number
    description?: string
    estimated_price?: number
    supplier_part_number?: string
    availability?: 'in_stock' | 'backorder' | 'discontinued'
    delivery_days?: number
    cost_price?: number
    retail_price?: number
    notes?: string
}

// Supplier information for parts requests
export interface SelectedSupplier {
    id: string
    name: string
    phone_number?: string
    contact_person?: string
    email?: string
    account_number?: string
    isCustom?: boolean
}

export interface SupplierInfo {
    selected_suppliers: SelectedSupplier[]
    primary_supplier_id?: string
    backup_suppliers?: string[]
}

// Quote information structure
export interface QuoteInfo {
    supplier_name: string
    contact_person?: string
    supplier_reference?: string
    quote_date: string
    parts: Array<{
        part_name: string
        part_number?: string
        quantity: number
        supplier_part_number?: string
        availability: 'in_stock' | 'backorder' | 'discontinued'
        cost_price?: number
        retail_price?: number
        delivery_days?: number
        eta?: string
        notes?: string
    }>
    total_quote: number
    call_notes?: string
    quote_valid_until?: string
}

// Main parts request interface (matches database schema)
export interface PartsRequest {
    id: string
    created_at: string
    updated_at: string
    shop_id: string
    user_id?: string
    vehicle_info: VehicleInfo
    parts_requested: PartItem[]
    total_estimated_price?: number
    status: PartsRequestStatus
    priority: PartsRequestPriority
    notes?: string
    customer_notes?: string
    assigned_to?: string
    admin_notes?: string
    quote_provided?: QuoteInfo
    actual_cost?: number
    supplier_info?: SupplierInfo
    order_placed_at?: string
    estimated_delivery?: string
    fulfilled_at?: string
}

// Request interfaces for API calls
export interface CreatePartsRequestData {
    vehicle_info: VehicleInfo
    parts_requested: PartItem[]
    supplier_info?: SupplierInfo
    priority?: PartsRequestPriority
    notes?: string
    customer_notes?: string
}

export interface UpdatePartsRequestData extends Partial<CreatePartsRequestData> {
    status?: PartsRequestStatus
    assigned_to?: string
    admin_notes?: string
    quote_provided?: QuoteInfo
    actual_cost?: number
    order_placed_at?: string
    estimated_delivery?: string
    fulfilled_at?: string
}

// Response interfaces
export interface PartsRequestResponse {
    success: boolean
    data?: PartsRequest
    message?: string
    error?: string
}

export interface PartsRequestListResponse {
    success: boolean
    data?: PartsRequest[]
    total?: number
    page?: number
    limit?: number
    message?: string
    error?: string
}

// Form state interfaces for UI components
export interface PartsRequestFormState {
    selectedSuppliers: SelectedSupplier[]
    vehicleInfo: VehicleInfo
    partInfo: PartItem
    priority: PartsRequestPriority
    notes: string
    customerNotes: string
    isSubmitting: boolean
}

// Validation interface
export interface PartsRequestValidation {
    isValid: boolean
    errors: {
        suppliers?: string
        vehicle?: string
        parts?: string
        general?: string
    }
}

// Filter and search interfaces
export interface PartsRequestFilter {
    status?: PartsRequestStatus[]
    priority?: PartsRequestPriority[]
    assigned_to?: string
    date_from?: string
    date_to?: string
    supplier_id?: string
    search?: string
}

export interface PartsRequestSort {
    field: keyof PartsRequest
    direction: 'asc' | 'desc'
}

// Statistics interface
export interface PartsRequestStats {
    total_requests: number
    pending_requests: number
    quoted_requests: number
    ordered_requests: number
    fulfilled_requests: number
    cancelled_requests: number
    average_completion_time?: number
    total_value?: number
}

// Export all types as a namespace for easy importing
export namespace PartsRequestTypes {
    export type Status = PartsRequestStatus
    export type Priority = PartsRequestPriority
    export type Vehicle = VehicleInfo
    export type Part = PartItem
    export type Supplier = SelectedSupplier
    export type Quote = QuoteInfo
    export type Request = PartsRequest
    export type CreateData = CreatePartsRequestData
    export type UpdateData = UpdatePartsRequestData
    export type Response = PartsRequestResponse
    export type ListResponse = PartsRequestListResponse
    export type FormState = PartsRequestFormState
    export type Validation = PartsRequestValidation
    export type Filter = PartsRequestFilter
    export type Sort = PartsRequestSort
    export type Stats = PartsRequestStats
}
