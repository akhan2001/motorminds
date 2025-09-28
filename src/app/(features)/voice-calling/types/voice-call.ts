export interface VoiceCall {
    id: string
    created_at: string
    updated_at: string
    shop_id: string
    user_id?: string
    supplier_id?: string
    phone_number: string
    purpose: VoiceCallPurpose
    status: VoiceCallStatus
    vapi_call_id?: string
    vapi_assistant_id?: string
    started_at?: string
    ended_at?: string
    duration_seconds?: number
    transcript: any
    call_summary?: string
    parts_discussed: any[]
    actions_taken: any[]
    parts_request_id?: string
    order_created: boolean
    quote_received?: any
    call_metadata: any
    error_details?: any
    // Relations
    supplier?: {
        id: string
        name: string
        contact_person?: string
    }
    parts_request?: {
        id: string
        status: string
        parts_requested: any[]
        vehicle_info: any
    }
}

export type VoiceCallPurpose = 'parts_ordering' | 'general_inquiry' | 'quote_request' | 'order_followup'

export type VoiceCallStatus = 'pending' | 'connecting' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'ready_to_order'

export interface VoiceCallAnalysis {
    parts_info?: Array<{
        part_name: string
        name?: string
        quantity: number
        unit_price?: number
        price?: number
        part_number?: string
        availability?: string
        delivery_days?: number
        vehicle_application?: string
        notes?: string
    }>
    quote_details?: {
        total_cost: number
        subtotal?: number
        shipping_cost?: number
        currency?: string
        availability?: string
        delivery_eta?: string
        delivery_days?: number
    }
    call_outcome?: {
        status: string
        notes?: string
        quote_provided?: boolean
        quote_accepted?: boolean
        follow_up_needed?: boolean
        requires_approval?: boolean
        special_instructions?: string
    }
    vehicle_info?: {
        year: string
        make: string
        model: string
        engine?: string
        vin?: string
        mileage?: string
    }
    supplier_info?: {
        supplier_name?: string
        account_used?: string
        contact_person?: string
    }
    next_steps?: {
        order_ready?: boolean
        follow_up_needed?: boolean
        requires_approval?: boolean
        special_instructions?: string
    }
    call_metadata?: {
        language?: string
        department?: string
    }
}

export interface CreateVoiceCallData {
    shop_id: string
    user_id?: string
    supplier_id?: string
    phone_number: string
    purpose: VoiceCallPurpose
    vapi_call_id?: string
    vapi_assistant_id?: string
    parts_request_id?: string
    call_metadata?: any
}

export interface UpdateVoiceCallData {
    status?: VoiceCallStatus
    started_at?: string
    ended_at?: string
    duration_seconds?: number
    transcript?: any
    call_summary?: string
    parts_discussed?: any[]
    actions_taken?: any[]
    order_created?: boolean
    quote_received?: any
    call_metadata?: any
    error_details?: any
}
