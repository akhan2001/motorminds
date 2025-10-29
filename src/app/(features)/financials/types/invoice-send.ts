import { Invoice } from '@/app/invoices/types/invoice'

// Interface for invoice email data
export interface InvoiceEmailData {
    invoiceNumber: string
    customerEmail: string
    customerName: string
    message: string
    vehicleInfo?: string
    totalAmount?: number
}

// Modal state types
export interface InvoiceSendModalProps {
    invoice: Invoice
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendEmail: boolean, customMessage?: string) => void
}

// Email availability types
export interface EmailAvailability {
    isAvailable: boolean
    hasResendKey: boolean
    isLoading: boolean
    error?: string
}

// Email sending response types
export interface EmailSendResponse {
    success: boolean
    emailId?: string
    error?: string
}

// Email sending request
export interface EmailSendRequest {
    to: string
    subject: string
    body: string
    customerName?: string
    invoiceNumber?: string
}

