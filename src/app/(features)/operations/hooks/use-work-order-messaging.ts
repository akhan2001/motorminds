import { useState, useEffect } from 'react'
import { useAuth } from './use-auth'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { 
    MessagingAvailability, 
    MessageSendResponse, 
    MessageSendRequest,
    TwilioPhoneNumber 
} from '../types/work-order-messaging'

export const useMessagingAvailability = () => {
    const [availability, setAvailability] = useState<MessagingAvailability>({
        isAvailable: false,
        hasActivePhoneNumber: false,
        isLoading: true,
        error: undefined
    })
    
    const { user, shopId } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        const checkMessagingAvailability = async () => {
            if (!shopId) {
                setAvailability({
                    isAvailable: false,
                    hasActivePhoneNumber: false,
                    isLoading: false,
                    error: 'No shop found'
                })
                return
            }

            try {
                const { data: phoneNumbers, error } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', shopId)
                    .eq('status', 'active')
                    .limit(1)

                if (error) {
                    console.error('Error checking messaging availability:', error)
                    setAvailability({
                        isAvailable: false,
                        hasActivePhoneNumber: false,
                        isLoading: false,
                        error: 'Failed to check messaging availability'
                    })
                    return
                }

                const hasActiveNumber = phoneNumbers && phoneNumbers.length > 0
                
                setAvailability({
                    isAvailable: hasActiveNumber,
                    hasActivePhoneNumber: hasActiveNumber,
                    isLoading: false,
                    error: undefined
                })
            } catch (error) {
                console.error('Error checking messaging availability:', error)
                setAvailability({
                    isAvailable: false,
                    hasActivePhoneNumber: false,
                    isLoading: false,
                    error: 'Failed to check messaging availability'
                })
            }
        }

        checkMessagingAvailability()
    }, [shopId, supabase])

    return availability
}

export const useWorkOrderMessaging = () => {
    const [isLoading, setIsLoading] = useState(false)
    const messagingAvailability = useMessagingAvailability()

    const sendCompletionMessage = async (request: MessageSendRequest): Promise<MessageSendResponse> => {
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
                toast.success('Completion message sent successfully!')
                return {
                    success: true,
                    message: data.message,
                    twilioSid: data.twilioSid
                }
            } else {
                const errorMessage = data.error || 'Failed to send completion message'
                toast.error(errorMessage)
                return {
                    success: false,
                    error: errorMessage
                }
            }
        } catch (error) {
            console.error('Failed to send completion message:', error)
            const errorMessage = 'Failed to send completion message'
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
        sendCompletionMessage,
        isLoading,
        messagingAvailability
    }
}