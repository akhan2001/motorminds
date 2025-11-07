export interface MessageQueueItem {
    id: string
    shop_id: string
    template_id?: string | null
    customer_id?: string | null
    phone_number: string
    message_body: string
    status: 'pending' | 'sent' | 'failed'
    scheduled_send_at: string
    sent_at?: string | null
    sms_message_id?: string | null
    retry_count: number
    error_message?: string | null
    created_at: string
    updated_at: string
}

export interface MessageQueueCreateData {
    shop_id: string
    template_id?: string
    customer_id?: string
    phone_number: string
    message_body: string
    scheduled_send_at?: string // If not provided, defaults to now()
    status?: 'pending' | 'sent' | 'failed'
    retry_count?: number
}

