import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { getResendClient } from '@/app/(features)/financials/lib/email/resend-client'

// Types
interface SendInvoiceEmailRequest {
    to: string
    subject: string
    body: string
    customerName?: string
    invoiceNumber?: string
}

// POST /api/email/send-invoice - Send invoice email
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = await getShopIdForUser()
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        const body: SendInvoiceEmailRequest = await request.json()
        const { to, subject, body: emailBody, customerName, invoiceNumber } = body

        // Validate input
        if (!to || !subject || !emailBody) {
            return NextResponse.json({ 
                error: 'Missing required fields: to, subject, body' 
            }, { status: 400 })
        }

        // Get Resend client
        const resend = getResendClient()
        if (!resend) {
            return NextResponse.json({ 
                error: 'Email service is not configured. Please set up Resend API key.' 
            }, { status: 400 })
        }

        // Get shop information for the "from" email
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('shop_name, shop_email')
            .eq('id', shopId)
            .single()

        if (shopError || !shop) {
            return NextResponse.json({ 
                error: 'Failed to fetch shop information' 
            }, { status: 400 })
        }

        // Always use verified domain for "from" address
        // Use shop email as reply-to if it exists
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@motorminds.ca' // Always use verified domain
        const fromName = shop.shop_name || 'MotorMinds'
        const replyToEmail = shop.shop_email // Shop's actual email for replies

        // Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            replyTo: replyToEmail ? [replyToEmail] : undefined,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                        <h2 style="color: #1a1a1a; margin-top: 0;">${fromName}</h2>
                        <p style="white-space: pre-wrap; margin: 20px 0;">${emailBody}</p>
                    </div>
                    <div style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p>This email was sent from ${fromName}</p>
                        ${replyToEmail ? `<p>Reply to: ${replyToEmail}</p>` : ''}
                    </div>
                </body>
                </html>
            `,
            text: emailBody
        })

        if (emailError) {
            console.error('Resend error:', emailError)
            return NextResponse.json({ 
                error: 'Failed to send email: ' + emailError.message 
            }, { status: 500 })
        }

        // Store email record in database
        const { data: storedEmail, error: dbError } = await supabase
            .from('invoice_emails')
            .insert({
                shop_id: shopId,
                invoice_number: invoiceNumber,
                recipient_email: to,
                recipient_name: customerName,
                subject: subject,
                body: emailBody,
                status: 'sent',
                email_provider_id: emailData?.id,
                sent_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('Failed to store email record:', dbError)
            // Don't fail the request if we can't store the record
        }

        return NextResponse.json({
            success: true,
            emailId: emailData?.id,
            storedEmail
        })

    } catch (error: any) {
        console.error('POST /api/email/send-invoice error:', error)

        // Handle specific errors
        if (error.message) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

