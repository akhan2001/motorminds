import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/utils/supabase/server'
import { config } from '@/lib/config'
import { generateInvoiceEmailHTML, generateInvoiceEmailSubject } from '@/lib/email-templates/invoice-email'

const resend = new Resend(config.email.resendApiKey)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { invoiceIdentifier, type = 'auto' } = body

        if (!invoiceIdentifier) {
            return NextResponse.json(
                { error: 'Invoice identifier is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Build query based on identifier type or auto-detect
        let query = supabase
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

        // Determine search strategy
        if (type === 'display_id') {
            query = query.eq('display_id', invoiceIdentifier)
        } else if (type === 'invoice_number') {
            query = query.eq('invoice_number', invoiceIdentifier)
        } else {
            // Auto-detect: try display_id first, then invoice_number
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceIdentifier)
            
            if (isUUID) {
                query = query.eq('invoice_number', invoiceIdentifier)
            } else {
                query = query.eq('display_id', invoiceIdentifier)
            }
        }

        const { data: invoice, error: invoiceError } = await query.single()

        if (invoiceError || !invoice) {
            // If auto-detect failed and we tried display_id, try invoice_number
            if (type === 'auto' && !invoiceError?.message?.includes('More than one row')) {
                const fallbackQuery = supabase
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
                    .eq('invoice_number', invoiceIdentifier)
                
                const { data: fallbackInvoice, error: fallbackError } = await fallbackQuery.single()
                
                if (fallbackError || !fallbackInvoice) {
                    return NextResponse.json(
                        { 
                            error: 'Invoice not found',
                            details: `No invoice found with identifier: ${invoiceIdentifier}`
                        },
                        { status: 404 }
                    )
                }
                
                // Use fallback invoice
                Object.assign(invoice, fallbackInvoice)
            } else {
                return NextResponse.json(
                    { 
                        error: 'Invoice not found',
                        details: invoiceError?.message || `No invoice found with identifier: ${invoiceIdentifier}`
                    },
                    { status: 404 }
                )
            }
        }

        // Verify user has access to this invoice's shop
        const { data: userShopAccess } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (!userShopAccess || userShopAccess.shop_id !== invoice.shop_id) {
            return NextResponse.json(
                { error: 'Access denied to this invoice' },
                { status: 403 }
            )
        }

        if (!invoice.client_email) {
            return NextResponse.json(
                { error: 'Customer email is required to send invoice' },
                { status: 400 }
            )
        }

        // Create invoice view URL (always use UUID for internal links)
        const invoiceUrl = `${config.app.baseUrl}/invoices?invoiceId=${invoice.invoice_number}`

        // Generate email content using templates
        const emailHTML = generateInvoiceEmailHTML({
            invoice: {
                invoice_number: invoice.invoice_number,
                display_id: invoice.display_id,
                client_name: invoice.client_name,
                amount: invoice.amount,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                notes: invoice.notes,
                customer_notes: invoice.customer_notes,
                source: invoice.source,
                labour_total_price: invoice.labour_total_price,
                parts_total_price: invoice.parts_total_price,
                vehicle_information: invoice.vehicle_information
            },
            shop: {
                shop_name: invoice.shops.shop_name,
                shop_address: invoice.shops.shop_address,
                shop_email: invoice.shops.shop_email,
                shop_phone: invoice.shops.shop_phone
            },
            invoiceUrl
        })

        const emailSubject = generateInvoiceEmailSubject(
            invoice.shops.shop_name,
            invoice.display_id || invoice.invoice_number
        )

        // Send email
        const { data, error } = await resend.emails.send({
            from: `${invoice.shops.shop_name} <noreply@${config.email.fromDomain}>`,
            to: [invoice.client_email],
            subject: emailSubject,
            html: emailHTML
        })

        if (error) {
            console.error('Email sending error:', error)
            return NextResponse.json(
                { error: 'Failed to send invoice email', details: error },
                { status: 500 }
            )
        }

        // Update invoice status to 'sent' if it was 'draft'
        if (invoice.status === 'draft') {
            await supabase
                .from('invoices')
                .update({ status: 'sent' })
                .eq('invoice_number', invoice.invoice_number)
        }

        return NextResponse.json({
            success: true,
            message: 'Invoice sent successfully',
            data: {
                emailId: data?.id,
                invoiceId: invoice.invoice_number,
                displayId: invoice.display_id,
                recipientEmail: invoice.client_email,
                sentAt: new Date().toISOString()
            }
        }, { status: 200 })

    } catch (error) {
        console.error('Error sending invoice:', error)

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to send invoice' },
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
