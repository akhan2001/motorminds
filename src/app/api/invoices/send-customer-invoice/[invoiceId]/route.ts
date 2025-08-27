import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { config } from '@/lib/config'

const resend = new Resend(config.email.resendApiKey)

export async function POST(
    request: NextRequest,
    { params }: { params: { invoiceId: string } }
) {
    try {
        const { invoiceId } = params
        
        if (!invoiceId) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            )
        }
        
        // Fetch complete invoice details with shop and customer info
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
                *,
                shops (
                    shop_name,
                    shop_address,
                    shop_email,
                    shop_phone
                )
            `)
            .eq('invoice_number', invoiceId)
            .single()
        
        if (invoiceError || !invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }
        
        if (!invoice.client_email) {
            return NextResponse.json(
                { error: 'Customer email is required to send invoice' },
                { status: 400 }
            )
        }
        
        // Create invoice view URL
        const invoiceUrl = `${config.app.baseUrl}/invoices?invoiceId=${invoiceId}`
        
        // Format currency
        const formatCurrency = (amount: number | null | undefined): string => {
            if (amount === null || amount === undefined) return '$0.00'
            return `$${Number(amount).toFixed(2)}`
        }
        
        // Prepare email content
        const isCustomerGenerated = invoice.source === 'customer_generated'
        const hasEstimate = invoice.estimated_amount && invoice.estimated_amount > 0
        const actualAmount = invoice.amount || 0
        
        // Note: Removed budget comparison section
        
        // Format vehicle info
        const vehicleInfo = invoice.vehicle_information ? 
            `${invoice.vehicle_information.year} ${invoice.vehicle_information.make} ${invoice.vehicle_information.model}` : 
            'Vehicle information not available'
        
        // Send email
        const { data, error } = await resend.emails.send({
            from: `${invoice.shops.shop_name} <noreply@${config.email.fromDomain}>`,
            to: [invoice.client_email],
            subject: `Invoice Ready - ${invoice.shops.shop_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Invoice Ready for Review</h2>
                        
                        <p style="color: #666; font-size: 16px;">Hello ${invoice.client_name},</p>
                        
                        <p style="color: #666; font-size: 16px;">Your service work has been completed and your invoice is ready for review.</p>
                        
                        ${isCustomerGenerated && invoice.customer_notes ? `
                            <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4 style="color: #1976d2; margin: 0 0 10px 0;">Your Original Request:</h4>
                                <p style="margin: 0; color: #424242; font-style: italic;">"${invoice.customer_notes}"</p>
                            </div>
                        ` : ''}
                        
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #333; margin: 0 0 15px 0;">Invoice Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Invoice #:</td>
                                    <td style="padding: 8px 0; color: #333; font-weight: bold;">${invoice.display_id || invoice.invoice_number}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Vehicle:</td>
                                    <td style="padding: 8px 0; color: #333;">${vehicleInfo}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Service Date:</td>
                                    <td style="padding: 8px 0; color: #333;">${new Date(invoice.issue_date).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; border-top: 2px solid #ddd; font-weight: bold;">Total Amount:</td>
                                    <td style="padding: 8px 0; color: #333; border-top: 2px solid #ddd; font-weight: bold; font-size: 18px;">${formatCurrency(actualAmount)}</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${invoice.labour_total_price || invoice.parts_total_price ? `
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4 style="color: #856404; margin: 0 0 10px 0;">Service Breakdown:</h4>
                                ${invoice.labour_total_price ? `<p style="margin: 5px 0; color: #856404;">Labor: ${formatCurrency(invoice.labour_total_price)}</p>` : ''}
                                ${invoice.parts_total_price ? `<p style="margin: 5px 0; color: #856404;">Parts: ${formatCurrency(invoice.parts_total_price)}</p>` : ''}
                            </div>
                        ` : ''}
                        
                        ${invoice.notes ? `
                            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4 style="color: #495057; margin: 0 0 10px 0;">Service Notes:</h4>
                                <p style="margin: 0; color: #6c757d;">${invoice.notes}</p>
                            </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${invoiceUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                View Full Invoice
                            </a>
                        </div>
                        
                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                            <h4 style="color: #333; margin: 0 0 10px 0;">Payment Instructions:</h4>
                            <p style="color: #666; margin: 5px 0;">Please visit us at:</p>
                            <p style="color: #333; margin: 0; font-weight: bold;">${invoice.shops.shop_name}</p>
                            <p style="color: #666; margin: 0;">${invoice.shops.shop_address}</p>
                            ${invoice.shops.shop_phone ? `<p style="color: #666; margin: 5px 0;">Phone: ${invoice.shops.shop_phone}</p>` : ''}
                        </div>
                        
                        <p style="color: #999; font-size: 14px; margin-top: 30px;">
                            Thank you for choosing ${invoice.shops.shop_name}. We appreciate your business!
                        </p>
                    </div>
                </div>
            `
        })
        
        if (error) {
            console.error('Email sending error:', error)
            return NextResponse.json(
                { error: 'Failed to send invoice email' },
                { status: 500 }
            )
        }
        
        // Note: Removed automatic invoice sent logging to notes
        
        return NextResponse.json({
            success: true,
            message: 'Invoice sent successfully',
            emailId: data?.id
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error sending customer invoice:', error)
        
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }
        
        return NextResponse.json(
            { error: 'Failed to send customer invoice' },
            { status: 500 }
        )
    }
}

// Handle preflight CORS requests
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 