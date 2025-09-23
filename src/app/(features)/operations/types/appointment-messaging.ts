import { AppointmentWithDetails } from './appointment'

// Interface for appointment message data
export interface AppointmentMessage {
    appointmentId: string
    customerPhone: string
    customerName: string
    message: string
    vehicleInfo?: string
    appointmentDate?: string
    serviceType?: string
}

// Modal state types
export interface AppointmentMessageModalProps {
    appointment: AppointmentWithDetails
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendMessage: boolean, customMessage?: string) => void
    messageType?: 'reminder' | 'confirmation' | 'custom'
}

// Re-export messaging types from work-order-messaging
export type { 
    MessagingAvailability, 
    MessageSendResponse, 
    MessageSendRequest,
    TwilioPhoneNumber 
} from './work-order-messaging'
