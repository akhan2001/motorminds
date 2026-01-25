/**
 * SMS/MMS Messaging Types
 */

// Message direction
export type MessageDirection = 'inbound' | 'outbound'

// Message type (SMS vs MMS)
export type MessageType = 'sms' | 'mms'

// Message status from Twilio
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'received'

// Customer attached to conversation
export interface SmsCustomer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone: string
    customer_address?: string
    customer_vehicle?: any
    license_plate?: string
    notes?: string
    tags?: string[]
}

// Twilio phone number assigned to shop
export interface TwilioPhoneNumber {
    id: string
    phone_number: string
    friendly_name: string
    status: 'active' | 'inactive'
    shop_id: string
}

// SMS/MMS message
export interface SmsMessage {
    id: string
    shop_id: string
    phone_number_id: string
    direction: MessageDirection
    message_body: string
    created_at: string
    from_number: string
    to_number: string
    customer_id?: string
    customer?: SmsCustomer
    message_type: MessageType
    media_urls: string[]
    media_count: number
    status: MessageStatus
    twilio_sid?: string
}

// Recent message preview in conversation list
export interface RecentMessage {
    message_body: string
    direction: MessageDirection
    created_at: string
    media_count?: number
    message_type?: MessageType
}

// Conversation (one per customer phone number)
export interface SmsConversation {
    id: string
    shop_id: string
    customer_phone: string
    normalized_phone?: string
    customer_name?: string
    customer_id?: string
    last_message_at: string
    customer?: SmsCustomer
    recent_message?: RecentMessage
}

// Uploaded media file
export interface UploadedMedia {
    url: string
    fileName: string
    fileSize: number
    fileType: string
    storagePath: string
}

// Send message request
export interface SendMessageRequest {
    to: string
    body?: string
    customerName?: string
    mediaUrls?: string[]
}

// Send message response
export interface SendMessageResponse {
    success: boolean
    message?: SmsMessage
    twilioSid?: string
    messageType?: MessageType
    error?: string
}

// Media upload response
export interface MediaUploadResponse {
    success: boolean
    url: string
    fileName: string
    fileSize: number
    fileType: string
    storagePath: string
}
