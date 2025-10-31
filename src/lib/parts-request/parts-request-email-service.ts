import { createClient } from '@/utils/supabase/client'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { SendPartsRequestEmailVariables, SendPartsRequestEmailData } from '../types/parts-request-email'

export async function sendPartsRequestEmail({
    partsRequestId,
    shopId,
    vehicleInfo,
    partsRequested,
    customerNotes,
    notes,
    totalEstimatedPrice,
    priority,
}: SendPartsRequestEmailVariables): Promise<SendPartsRequestEmailData> {
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

        // Verify shop ID (use provided shopId or get from user)
        let finalShopId = shopId
        if (!finalShopId) {
            console.log('Getting shop ID for user:', user.id)
            const userShopId = await getShopId(user.id)
            console.log('Retrieved shop ID:', userShopId)
            
            if (!userShopId) {
                console.error('No shop ID found for user:', user.id)
                return {
                    success: false,
                    error: 'Shop not found'
                }
            }
            finalShopId = userShopId
        }

        // Send email notification directly
        try {
            const emailResponse = await fetch('/api/parts-requests/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partsRequestId,
                    shopId: finalShopId,
                    vehicleInfo,
                    partsRequested,
                    customerNotes,
                    notes,
                    totalEstimatedPrice,
                    priority: priority || 'normal'
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

            const data = await emailResponse.json()
            return {
                success: true,
                resendId: data?.resendId
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError)
            return {
                success: false,
                error: 'Failed to send email notification'
            }
        }

    } catch (error) {
        console.error('Parts request email service error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

