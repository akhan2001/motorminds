import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { getResendClient } from '@/app/(features)/financials/lib/email/resend-client'
import { 
    generateInvoiceEmailHTML, 
    generateInvoiceEmailText 
} from '@/app/(features)/financials/lib/email/invoice-email-template'

// Types
interface SendInvoiceEmailRequest {
    to: string
    subject: string
    body: string
    customerName?: string
    invoiceNumber?: string
    totalAmount?: number
    vehicleInfo?: string
    // PDF attachment (base64 encoded)
    pdfBase64?: string
    pdfFilename?: string
}

// POST /api/email/send-invoice - Send invoice email with optional PDF attachment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = await getShopIdForUser()
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 })
        }

        const body: SendInvoiceEmailRequest = await request.json()
        const { 
            to, 
            subject, 
            body: emailBody, 
            customerName, 
            invoiceNumber,
            totalAmount,
            vehicleInfo,
            pdfBase64,
            pdfFilename
        } = body

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
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@motorminds.ca'
        const fromName = shop.shop_name || 'MotorMinds'
        const replyToEmail = shop.shop_email

        // Generate HTML and text versions of the email
        const emailTemplateData = {
            shopName: fromName,
            shopEmail: replyToEmail || undefined,
            customerName: customerName || 'Customer',
            invoiceNumber: invoiceNumber || 'N/A',
            totalAmount: totalAmount || 0,
            vehicleInfo: vehicleInfo,
            messageBody: emailBody,
            hasPdfAttachment: !!pdfBase64
        }

        const htmlContent = generateInvoiceEmailHTML(emailTemplateData)
        const textContent = generateInvoiceEmailText(emailTemplateData)

        // Prepare attachments if PDF is provided
        const attachments = pdfBase64 ? [{
            filename: pdfFilename || `Invoice_${invoiceNumber || 'document'}.pdf`,
            content: Buffer.from(pdfBase64, 'base64')
        }] : undefined

        // Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [to],
            replyTo: replyToEmail ? [replyToEmail] : undefined,
            subject: subject,
            html: htmlContent,
            text: textContent,
            attachments: attachments
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
                sent_at: new Date().toISOString(),
                has_pdf_attachment: !!pdfBase64
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
            storedEmail,
            hasPdfAttachment: !!pdfBase64
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
