import { useState } from 'react'
import { toast } from 'sonner'
import { useMessagingAvailability } from '../use-work-order-messaging'
import type { 
    MessageSendResponse, 
    MessageSendRequest 
} from '../../types/appointment-messaging'

export const useAppointmentMessaging = () => {
    const [isLoading, setIsLoading] = useState(false)
    const messagingAvailability = useMessagingAvailability()

    const sendAppointmentMessage = async (request: MessageSendRequest): Promise<MessageSendResponse> => {
        if (!messagingAvailability.isAvailable) {
            const errorMessage = 'Messaging is not available. Contact admin to set up Twilio phone numbers.'
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
                toast.success('Message sent successfully!')
                return {
                    success: true,
                    message: data.message,
                    twilioSid: data.twilioSid
                }
            } else {
                const errorMessage = data.error || 'Failed to send message'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send appointment message:', error)
            const errorMessage = 'Failed to send message'
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
        sendAppointmentMessage,
        isLoading,
        messagingAvailability
    }
}
