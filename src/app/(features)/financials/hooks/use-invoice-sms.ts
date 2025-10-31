import { useState } from 'react'
import { toast } from 'sonner'
import { useMessagingAvailability } from '../../operations/hooks/use-work-order-messaging'

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

export const useInvoiceSms = () => {
    const [isLoading, setIsLoading] = useState(false)
    const messagingAvailability = useMessagingAvailability()

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

    return {
        sendInvoiceSms,
        isLoading,
        messagingAvailability
    }
}
