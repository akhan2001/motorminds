import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
    request: NextRequest,
    { params }: { params: { invoiceId: string } }
) {
    try {
        const { invoiceId } = params
        const body = await request.json()
        
        // Validate required fields
        const { shopId, customer_notes, estimated_amount } = body
        
        if (!shopId) {
            return NextResponse.json(
                { error: 'Shop ID is required' },
                { status: 400 }
            )
        }
        
        if (!invoiceId) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            )
        }
        
        // Validate customer notes
        if (customer_notes && (typeof customer_notes !== 'string' || customer_notes.trim().length < 10)) {
            return NextResponse.json(
                { error: 'Customer notes must be at least 10 characters if provided' },
                { status: 400 }
            )
        }
        
        // Validate estimated amount
        let parsedAmount: number | null = null
        if (estimated_amount !== null && estimated_amount !== undefined) {
            parsedAmount = parseFloat(estimated_amount)
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                return NextResponse.json(
                    { error: 'Estimated amount must be a valid positive number' },
                    { status: 400 }
                )
            }
        }
        
        // Check if invoice exists and is customer-generated
        const { data: existingInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select('source, shop_id')
            .eq('invoice_number', invoiceId)
            .single()
        
        if (fetchError) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }
        
        if (existingInvoice.shop_id !== shopId) {
            return NextResponse.json(
                { error: 'Unauthorized access to invoice' },
                { status: 403 }
            )
        }
        
        if (existingInvoice.source !== 'customer_generated') {
            return NextResponse.json(
                { error: 'Only customer-generated invoices can be updated via this endpoint' },
                { status: 400 }
            )
        }
        
        // Prepare update data
        const updateData: any = {}
        
        if (customer_notes !== undefined) {
            updateData.customer_notes = customer_notes?.trim() || null
        }
        
        if (estimated_amount !== undefined) {
            updateData.estimated_amount = parsedAmount
        }
        
        // Update the invoice
        const { data: updatedInvoice, error: updateError } = await supabase
            .from('invoices')
            .update(updateData)
            .eq('invoice_number', invoiceId)
            .eq('shop_id', shopId)
            .select()
            .single()
        
        if (updateError) {
            console.error('Error updating customer invoice:', updateError)
            return NextResponse.json(
                { error: 'Failed to update invoice' },
                { status: 500 }
            )
        }
        
        return NextResponse.json({
            success: true,
            invoice: updatedInvoice,
            message: 'Customer invoice updated successfully'
        }, { status: 200 })
        
    } catch (error) {
        console.error('Error in customer invoice update API:', error)
        
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }
        
        return NextResponse.json(
            { error: 'Failed to update customer invoice' },
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
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
} 