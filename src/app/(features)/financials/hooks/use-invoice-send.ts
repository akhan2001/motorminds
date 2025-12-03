import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { toast } from 'sonner'
import type { 
    EmailAvailability, 
    EmailSendResponse, 
    EmailSendRequest
} from '../types/invoice-send'

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

export const useInvoiceSend = () => {
    const [isLoading, setIsLoading] = useState(false)
    const emailAvailability = useEmailAvailability()

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

    return {
        sendInvoiceEmail,
        isLoading,
        emailAvailability
    }
}

