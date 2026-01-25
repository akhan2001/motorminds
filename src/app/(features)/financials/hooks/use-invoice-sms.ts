import { useState } from 'react'
import { toast } from 'sonner'
import { useMessagingAvailability } from '../../operations/hooks/use-work-order-messaging'
import { generateInvoicePDF, getInvoiceFilename } from '../lib/pdf/pdf-generator'
import { blobToBase64 } from '@/lib/utils/blob'
import type { InvoiceWithDetails } from '../types/invoice'
import type { ShopBranding } from '../types/invoice-pdf'

// Types for SMS sending
interface SmsSendRequest {
    to: string
    body: string
    customerName?: string
}

interface SmsSendResponse {
    success: boolean
    message?: any
    twilioSid?: string
    error?: string
}

interface PdfUploadResponse {
    success: boolean
    url?: string
    token?: string
    expiresAt?: string
    error?: string
}

export const useInvoiceSms = () => {
    const [isLoading, setIsLoading] = useState(false)
    const messagingAvailability = useMessagingAvailability()

    /**
     * Upload PDF and get shareable URL
     */
    const uploadPdfAndGetUrl = async (
        invoice: InvoiceWithDetails,
        shop: ShopBranding,
        templateId: string = 'professional'
    ): Promise<PdfUploadResponse> => {
        try {
            // Generate PDF
            const pdfBlob = await generateInvoicePDF(invoice, shop, templateId)
            const pdfBase64 = await blobToBase64(pdfBlob)
            const filename = getInvoiceFilename(invoice)

            // Upload to storage and get URL
            const response = await fetch('/api/invoices/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64,
                    invoiceNumber: invoice.invoice_number,
                    filename
                })
            })

            const data = await response.json()

            if (response.ok) {
                return {
                    success: true,
                    url: data.url,
                    token: data.token,
                    expiresAt: data.expiresAt
                }
            } else {
                return {
                    success: false,
                    error: data.error || 'Failed to upload PDF'
                }
            }
        } catch (error) {
            console.error('Failed to upload PDF:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to upload PDF'
            }
        }
    }

    /**
     * Send invoice SMS (simple version without PDF)
     */
    const sendInvoiceSms = async (request: SmsSendRequest): Promise<SmsSendResponse> => {
        if (!messagingAvailability.isAvailable) {
            const errorMessage = 'SMS service is not available. Contact admin to set up Twilio phone numbers.'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        }

        setIsLoading(true)
        
        try {
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Invoice SMS sent successfully!')
                return {
                    success: true,
                    message: data.message,
                    twilioSid: data.twilioSid
                }
            } else {
                const errorMessage = data.error || 'Failed to send invoice SMS'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send invoice SMS:', error)
            const errorMessage = 'Failed to send invoice SMS'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Send invoice SMS with PDF link
     */
    const sendInvoiceSmsWithPdf = async (
        request: SmsSendRequest,
        invoice: InvoiceWithDetails,
        shop: ShopBranding,
        templateId: string = 'professional'
    ): Promise<SmsSendResponse> => {
        if (!messagingAvailability.isAvailable) {
            const errorMessage = 'SMS service is not available. Contact admin to set up Twilio phone numbers.'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        }

        setIsLoading(true)
        
        try {
            // Upload PDF and get URL
            toast.info('Generating invoice PDF...')
            const pdfResult = await uploadPdfAndGetUrl(invoice, shop, templateId)
            
            if (!pdfResult.success || !pdfResult.url) {
                toast.error(pdfResult.error || 'Failed to generate PDF link')
                return {
                    success: false,
                    error: pdfResult.error || 'Failed to generate PDF link'
                }
            }

            // Append PDF link to message
            const messageWithLink = `${request.body}\n\nView Invoice: ${pdfResult.url}`

            // Send SMS
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    body: messageWithLink
                }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Invoice SMS sent with PDF link!')
                return {
                    success: true,
                    message: data.message,
                    twilioSid: data.twilioSid
                }
            } else {
                const errorMessage = data.error || 'Failed to send invoice SMS'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send invoice SMS with PDF:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice SMS'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {
        sendInvoiceSms,
        sendInvoiceSmsWithPdf,
        uploadPdfAndGetUrl,
        isLoading,
        messagingAvailability
    }
}
