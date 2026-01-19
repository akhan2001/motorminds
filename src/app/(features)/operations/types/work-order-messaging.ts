import { WorkOrderWithDetails } from './work-order'

// Interface for completion message data
export interface WorkOrderCompletionMessage {
    workOrderId: string
    customerPhone: string
    customerName: string
    message: string
    vehicleInfo?: string
}

// Modal state types
export interface WorkOrderCompletionModalProps {
    workOrder: WorkOrderWithDetails
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendMessage: boolean, customMessage?: string, enableAutomatedMessages?: boolean, generateInvoice?: boolean) => void
}

// Messaging availability types
export interface MessagingAvailability {
    isAvailable: boolean
    hasActivePhoneNumber: boolean
    isLoading: boolean
    error?: string
}

// Twilio phone number interface
export interface TwilioPhoneNumber {
    id: string
    shop_id: string
    phone_number: string
    friendly_name?: string
    status: 'active' | 'inactive'
    created_at: string
    updated_at: string
}

// Message sending response types
export interface MessageSendResponse {
    success: boolean
    message?: any
    twilioSid?: string
    error?: string
}

// Message sending request
export interface MessageSendRequest {
    to: string
    body: string
    customerName?: string
}