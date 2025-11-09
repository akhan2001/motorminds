export type MessageQueueStatus = 'pending' | 'sent' | 'failed'

// Trigger events that can queue a message
export type TriggerEvent = 
    | 'work_order_complete'
    | 'appointment_confirmed'
    | 'invoice_created'
    | 'manual'

export interface MessageQueueItem {
    id: string
    shop_id: string
    template_id: string | null
    customer_id: string
    trigger_event: TriggerEvent
    trigger_data: Record<string, any> // JSONB - stores work order ID, service type, etc.
    scheduled_send_at: string
    sent_at: string | null
    sms_message_id: string | null
    status: MessageQueueStatus
    error_message: string | null
    retry_count: number
    created_at: string
}

export interface MessageQueueCreateData {
    shop_id: string
    template_id?: string | null
    customer_id: string
    trigger_event: TriggerEvent
    trigger_data?: Record<string, any>
    scheduled_send_at?: string // If not provided, defaults to now()
    status?: MessageQueueStatus
    retry_count?: number
}

export interface MessageQueueWithDetails extends MessageQueueItem {
    customer?: {
        id: string
        customer_name: string
        customer_phone: string
        customer_email?: string
    }
    template?: {
        id: string
        name: string
        trigger_type: string
    }
}

