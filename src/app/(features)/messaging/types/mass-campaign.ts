export type CampaignStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

export type RecipientStatus = 'pending' | 'sent' | 'failed'

// Customer segmentation filters
export interface CustomerSegment {
    // Date filters
    last_service_date_from?: string // ISO date
    last_service_date_to?: string // ISO date
    last_visit_days?: number // Filter by days since last visit
    
    // Service filters
    service_types?: string[] // Filter by service type received
    
    // Customer filters
    customer_tags?: string[]
    
    // Vehicle filters
    vehicle_makes?: string[]
    vehicle_models?: string[]
    vehicle_years?: number[]
    
    // Include/exclude filters
    include_customer_ids?: string[]
    exclude_customer_ids?: string[]
}

export interface MassCampaign {
    id: string
    shop_id: string
    name: string
    message: string
    customer_segment: CustomerSegment
    scheduled_send_at: string | null
    status: CampaignStatus
    total_recipients: number
    sent_count: number
    failed_count: number
    created_by: string | null
    created_at: string
    sent_at: string | null
}

export interface MassCampaignCreateData {
    shop_id: string
    name: string
    message: string
    customer_segment?: CustomerSegment
    scheduled_send_at?: string | null
    status?: CampaignStatus
    created_by?: string | null
}

export interface MassCampaignUpdateData {
    name?: string
    message?: string
    customer_segment?: CustomerSegment
    scheduled_send_at?: string | null
    status?: CampaignStatus
}

export interface CampaignRecipient {
    id: string
    campaign_id: string
    customer_id: string
    customer_phone: string
    status: RecipientStatus
    sent_at: string | null
    error_message: string | null
    sms_message_id: string | null
    retry_count: number
    created_at: string
}

export interface CampaignRecipientCreateData {
    campaign_id: string
    customer_id: string
    customer_phone: string
    status?: RecipientStatus
}

export interface CampaignWithDetails extends MassCampaign {
    creator?: {
        id: string
        email: string
    }
}

export interface CampaignStats {
    total: number
    draft: number
    scheduled: number
    in_progress: number
    completed: number
    failed: number
    cancelled: number
}

// Preview result when testing segmentation
export interface SegmentPreview {
    count: number
    sample_customers: Array<{
        id: string
        customer_name: string
        customer_phone: string
        customer_email?: string
        last_service_date?: string
    }>
}

