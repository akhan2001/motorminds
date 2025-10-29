import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/integrations/resend/resend-client'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    console.log('Feedback email API route called')
    try {
        const { feedbackId, feedbackType, message, shopId } = await request.json()
        console.log('Feedback email request:', { feedbackId, feedbackType, message, shopId })

        if (!feedbackId || !feedbackType || !message || !shopId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get shop details directly from database
        console.log('Looking up shop with ID:', shopId)
        const supabase = await createClient()
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('shop_name, shop_email, shop_phone, shop_address, shop_city, shop_province')
            .eq('id', shopId)
            .single()
        
        console.log('Shop query result:', { shopData, shopError })
        
        // Use shop data if found, otherwise create fallback
        let shop
        if (shopData && !shopError) {
            shop = shopData
            console.log('Found existing shop:', shop)
        } else {
            console.log('Shop not found, using fallback')
            shop = {
                shop_name: 'Motorminds Shop',
                shop_email: process.env.FEEDBACK_EMAIL || 'info@motorminds.ca'
            }
        }
        console.log('Using shop:', shop)

        // Create email content
        const subject = `New ${feedbackType} from ${shop.shop_name}`
        const emailBody = `
            <h2>New ${feedbackType} reported</h2>
            <p><strong>Shop:</strong> ${shop.shop_name}</p>
            <p><strong>Feedback ID:</strong> ${feedbackId}</p>
            <p><strong>Type:</strong> ${feedbackType}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p><small>This feedback was submitted via the Motorminds application.</small></p>
        `

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: `Motorminds Feedback <${process.env.RESEND_FROM_EMAIL || 'noreply@motorminds.ca'}>`,
            to: [process.env.FEEDBACK_EMAIL || 'info@motorminds.ca'],
            subject: subject,
            html: emailBody,
        })

        if (error) {
            console.error('Resend email error:', error)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }


        return NextResponse.json({ 
            success: true, 
            resendId: data?.id 
        })

    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
