import { useState, useEffect } from 'react'
import { useAuth } from '../../operations/hooks/use-auth'
import { toast } from 'sonner'
import { generateInvoicePDF, getInvoiceFilename } from '../lib/pdf/pdf-generator'
import { blobToBase64 } from '@/lib/utils/blob'
import type { 
    EmailAvailability, 
    EmailSendResponse, 
    EmailSendRequest
} from '../types/invoice-send'
import type { InvoiceWithDetails } from '../types/invoice'
import type { ShopBranding } from '../types/invoice-pdf'

export const useEmailAvailability = () => {
    const [availability, setAvailability] = useState<EmailAvailability>({
        isAvailable: false,
        hasResendKey: false,
        isLoading: true,
        error: undefined
    })
    
    const { shopId } = useAuth()

    useEffect(() => {
        const checkEmailAvailability = async () => {
            if (!shopId) {
                setAvailability({
                    isAvailable: false,
                    hasResendKey: false,
                    isLoading: false,
                    error: 'No shop found'
                })
                return
            }

            try {
                // Check if Resend is configured by calling a status endpoint
                const response = await fetch('/api/email/status')
                const data = await response.json()

                setAvailability({
                    isAvailable: data.isConfigured || false,
                    hasResendKey: data.isConfigured || false,
                    isLoading: false,
                    error: data.isConfigured ? undefined : 'Email service not configured'
                })
            } catch (error) {
                console.error('Error checking email availability:', error)
                setAvailability({
                    isAvailable: false,
                    hasResendKey: false,
                    isLoading: false,
                    error: 'Failed to check email availability'
                })
            }
        }

        checkEmailAvailability()
    }, [shopId])

    return availability
}

// Extended request type with PDF data
interface EmailSendRequestWithPdf extends EmailSendRequest {
    totalAmount?: number
    vehicleInfo?: string
    pdfBase64?: string
    pdfFilename?: string
}

export const useInvoiceSend = () => {
    const [isLoading, setIsLoading] = useState(false)
    const emailAvailability = useEmailAvailability()

    /**
     * Send invoice email (simple version without PDF)
     */
    const sendInvoiceEmail = async (request: EmailSendRequest): Promise<EmailSendResponse> => {
        if (!emailAvailability.isAvailable) {
            const errorMessage = 'Email service is not available. Contact admin to set up Resend.'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        }

        setIsLoading(true)
        
        try {
            const response = await fetch('/api/email/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Invoice email sent successfully!')
                return {
                    success: true,
                    emailId: data.emailId
                }
            } else {
                const errorMessage = data.error || 'Failed to send invoice email'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send invoice email:', error)
            const errorMessage = 'Failed to send invoice email'
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
     * Send invoice email with PDF attachment
     */
    const sendInvoiceEmailWithPdf = async (
        request: EmailSendRequest,
        invoice: InvoiceWithDetails,
        shop: ShopBranding,
        templateId: string = 'professional'
    ): Promise<EmailSendResponse> => {
        if (!emailAvailability.isAvailable) {
            const errorMessage = 'Email service is not available. Contact admin to set up Resend.'
            toast.error(errorMessage)
            return {
                success: false,
                error: errorMessage
            }
        }

        setIsLoading(true)
        
        try {
            // Generate PDF
            toast.info('Generating invoice PDF...')
            const pdfBlob = await generateInvoicePDF(invoice, shop, templateId)
            const pdfBase64 = await blobToBase64(pdfBlob)
            const pdfFilename = getInvoiceFilename(invoice)

            // Get vehicle info
            const vehicleInfo = invoice.vehicle 
                ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`
                : invoice.walk_in_vehicle_info 
                    ? `${invoice.walk_in_vehicle_info.year} ${invoice.walk_in_vehicle_info.make} ${invoice.walk_in_vehicle_info.model}`
                    : undefined

            // Send email with PDF attachment
            const extendedRequest: EmailSendRequestWithPdf = {
                ...request,
                totalAmount: invoice.total_amount,
                vehicleInfo: vehicleInfo,
                pdfBase64: pdfBase64,
                pdfFilename: pdfFilename
            }

            const response = await fetch('/api/email/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extendedRequest),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Invoice email sent with PDF attachment!')
                return {
                    success: true,
                    emailId: data.emailId
                }
            } else {
                const errorMessage = data.error || 'Failed to send invoice email'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send invoice email with PDF:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to send invoice email'
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
        sendInvoiceEmail,
        sendInvoiceEmailWithPdf,
        isLoading,
        emailAvailability
    }
}
