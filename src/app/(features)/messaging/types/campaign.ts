export interface MassCampaign {
    id: string
    shop_id: string
    name: string
    description?: string | null
    template_id: string
    status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled'
    scheduled_send_at?: string | null
    segment_criteria: Record<string, any> // JSONB field for segment filters
    total_recipients?: number | null
    sent_count?: number | null
    failed_count?: number | null
    created_at: string
    updated_at: string
}

export interface CampaignCreateData {
    shop_id: string
    name: string
    description?: string
    template_id: string
    scheduled_send_at?: string
    segment_criteria: Record<string, any>
    status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled'
}

export interface CampaignUpdateData {
    name?: string
    description?: string
    template_id?: string
    scheduled_send_at?: string
    segment_criteria?: Record<string, any>
    status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled'
    total_recipients?: number
    sent_count?: number
    failed_count?: number
}

export interface CampaignRecipient {
    id: string
    campaign_id: string
    customer_id: string
    phone_number: string
    status: 'pending' | 'sent' | 'failed'
    sent_at?: string | null
    error_message?: string | null
    sms_message_id?: string | null
    created_at: string
    updated_at: string
}

