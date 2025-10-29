import { createClient } from '@/utils/supabase/client'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { SendFeedbackVariables, SendFeedbackData } from '../types/feedback'

export async function sendFeedback({
    message,
    feedbackType,
    pathname,
    userAgent,
}: SendFeedbackVariables): Promise<SendFeedbackData> {
    try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return {
                success: false,
                error: 'User not authenticated'
            }
        }

        // Get shop ID using client-side utility
        console.log('Getting shop ID for user:', user.id)
        const shopId = await getShopId(user.id)
        console.log('Retrieved shop ID:', shopId)
        
        if (!shopId) {
            console.error('No shop ID found for user:', user.id)
            return {
                success: false,
                error: 'Shop not found'
            }
        }

        // Send email notification directly
        try {
            const emailResponse = await fetch('/api/feedback/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedbackId: `feedback_${Date.now()}`, // Generate unique ID
                    feedbackType,
                    message,
                    shopId
                })
            })

            if (!emailResponse.ok) {
                const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }))
                console.error('Email notification failed:', emailResponse.status, errorData)
                return {
                    success: false,
                    error: `Failed to send email notification: ${errorData.error || 'Unknown error'}`
                }
            }

            return {
                success: true,
                messageId: `feedback_${Date.now()}`
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError)
            return {
                success: false,
                error: 'Failed to send email notification'
            }
        }

    } catch (error) {
        console.error('Feedback service error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
