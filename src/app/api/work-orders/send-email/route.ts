import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/utils/supabase/server'
import { config } from '@/lib/config'

const resend = new Resend(config.email.resendApiKey)

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        const {
            workOrderId,
            customMessage,
            pdfBase64,
            pdfFilename,
        } = body

        if (!workOrderId) {
            return NextResponse.json({ error: 'workOrderId is required' }, { status: 400 })
        }

        // Fetch work order with shop, customer, vehicle
        const { data: workOrder, error: woError } = await supabase
            .from('work_orders')
            .select(`
                *,
                shops (
                    shop_name,
                    shop_address,
                    shop_email,
                    shop_phone
                ),
                customers (
                    customer_name,
                    customer_email,
                    customer_phone
                )
            `)
            .eq('id', workOrderId)
            .single()

        if (woError || !workOrder) {
            return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
        }

        const isWalkIn = workOrder.customer_type === 'walk_in' || !workOrder.customers
        const customerEmail = workOrder.customers?.customer_email

        if (isWalkIn || !customerEmail) {
            return NextResponse.json({ error: 'Customer email is required to send' }, { status: 400 })
        }

        const customerName = workOrder.customers?.customer_name || 'Customer'
        const shopName = workOrder.shops?.shop_name || 'Our Shop'
        const shopAddress = workOrder.shops?.shop_address || ''
        const shopPhone = workOrder.shops?.shop_phone || ''

        // Document label based on status
        function getDocLabel(status: string): string {
            switch ((status || '').toLowerCase()) {
                case 'pending':           return 'Estimate'
                case 'approved':          return 'Approved Estimate'
                case 'in_progress':       return 'Work In Progress Update'
                case 'waiting_parts':     return 'Work Order Update'
                case 'waiting_customer':  return 'Work Order — Awaiting Your Approval'
                case 'ready':             return 'Your Vehicle is Ready!'
                default:                  return 'Work Order Update'
            }
        }
        const docLabel = getDocLabel(workOrder.status)

        const bodyText = customMessage
            ? customMessage.replace(/\n/g, '<br/>')
            : `Hello ${customerName},<br/><br/>Please find your ${docLabel.toLowerCase()} attached for work order <strong>#${workOrder.work_order_number}</strong>.`

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">${docLabel}</h2>

                    <p style="color: #666; font-size: 16px;">${bodyText}</p>

                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">Work Order Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Work Order #:</td>
                                <td style="padding: 8px 0; color: #333; font-weight: bold;">${workOrder.work_order_number}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Status:</td>
                                <td style="padding: 8px 0; color: #333;">${docLabel}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666;">Date:</td>
                                <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>

                    ${pdfBase64 ? '<p style="color: #666;">The full document is attached as a PDF to this email.</p>' : ''}

                    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                        <p style="color: #666; margin: 5px 0;">If you have any questions, please contact us:</p>
                        <p style="color: #333; margin: 0; font-weight: bold;">${shopName}</p>
                        ${shopAddress ? `<p style="color: #666; margin: 0;">${shopAddress}</p>` : ''}
                        ${shopPhone ? `<p style="color: #666; margin: 5px 0;">Phone: ${shopPhone}</p>` : ''}
                    </div>

                    <p style="color: #999; font-size: 14px; margin-top: 30px;">
                        Thank you for choosing ${shopName}. We appreciate your business!
                    </p>
                </div>
            </div>
        `

        const attachments = pdfBase64 && pdfFilename
            ? [{ filename: pdfFilename, content: pdfBase64 }]
            : []

        const { data, error } = await resend.emails.send({
            from: `${shopName} <noreply@${config.email.fromDomain}>`,
            to: [customerEmail],
            subject: `${docLabel} — ${shopName}`,
            html: htmlBody,
            attachments,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        return NextResponse.json({ success: true, emailId: data?.id }, { status: 200 })

    } catch (error) {
        console.error('POST /api/work-orders/send-email error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
