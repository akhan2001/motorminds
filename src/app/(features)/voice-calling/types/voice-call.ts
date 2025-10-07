import { QuoteReceived } from './parts-request'

export type VoiceCallStatus = 
    | 'pending'
    | 'connecting'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'cancelled'

export type VoiceCallPurpose = 
    | 'quote_request'
    | 'order_followup'
    | 'parts_ordering'
    | 'general_inquiry'
    | 'other'

export interface VoiceCall {
    id: string
    created_at: string
    updated_at?: string
    shop_id: string
    user_id?: string
    supplier_id?: string
    supplier_name?: string
    phone_number: string
    purpose: VoiceCallPurpose
    status: VoiceCallStatus
    vapi_call_id?: string
    vapi_assistant_id?: string
    started_at?: string
    ended_at?: string
    duration_seconds?: number
    transcript?: Record<string, any>
    call_summary?: string
    parts_discussed?: any[]
    actions_taken?: any[]
    parts_request_id?: string
    order_created?: boolean
    quote_received?: QuoteReceived
    call_metadata?: Record<string, any>
    error_details?: Record<string, any>
    sequence_number?: number
}
