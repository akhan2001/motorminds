import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

type AnyObject = Record<string, any>

function toInt(value: any, fallback: number = 0): number {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

function normalizePartsArray(params: AnyObject): any[] {
    // Accept multiple shapes: parts_information | items | parts | single part fields
    const raw = params?.parts_information || params?.items || params?.parts

    if (Array.isArray(raw)) {
        return raw.map((p: AnyObject) => normalizeSinglePart(p))
    }

    // If provided as a single object with part fields
    if (raw && typeof raw === 'object') {
        return [normalizeSinglePart(raw)]
    }

    // Try to build from top-level fields
    if (
        params?.part_name || params?.partName ||
        params?.part_number || params?.partNumber
    ) {
        return [normalizeSinglePart(params)]
    }

    return []
}

function normalizeSinglePart(p: AnyObject): AnyObject {
    const quantity = toInt(p?.quantity ?? 1, 1)
    const deliveryDays = toInt(p?.delivery_days ?? p?.deliveryDays ?? p?.delivery_time_days ?? p?.delivery_time ?? 0, 0)
    const cost = Number.isFinite(Number(p?.cost_price)) ? Number(p?.cost_price) : (Number.isFinite(Number(p?.price)) ? Number(p?.price) : 0)

    return {
        part_name: p?.part_name ?? p?.partName ?? '',
        part_number: p?.part_number ?? p?.partNumber ?? '',
        quantity,
        supplier_part_number: p?.supplier_part_number ?? p?.supplierPartNumber ?? '',
        availability: p?.availability ?? p?.status ?? 'unknown',
        cost_price: cost,
        retail_price: Number.isFinite(Number(p?.retail_price)) ? Number(p?.retail_price) : 0,
        delivery_days: deliveryDays,
        eta: deliveryDays ? `${deliveryDays} business days` : 'TBD',
        notes: p?.notes ?? ''
    }
}

export async function POST(request: NextRequest) {
    try {
        // Vapi function tool usually sends JSON; support nested functionCall.parameters as well
        const rawBody = await request.json().catch(() => ({} as AnyObject))
        const params: AnyObject = rawBody?.functionCall?.parameters || rawBody || {}

        const partsRequestId = params?.parts_request_id || params?.partsRequestId
        if (!partsRequestId) {
            return NextResponse.json({ error: 'parts_request_id is required' }, { status: 400 })
        }

        const parts = normalizePartsArray(params)
        if (!Array.isArray(parts) || parts.length === 0) {
            return NextResponse.json({ error: 'At least one part item is required' }, { status: 400 })
        }

        const supplierName = params?.supplier_name || params?.supplierName || 'Unknown Supplier'
        const contactPerson = params?.contact_person || params?.contactPerson || ''

        const totalQuote = parts.reduce((sum: number, part: any) => sum + (Number(part.cost_price || 0) * Number(part.quantity || 1)), 0)

        const quoteData = {
            supplier_name: supplierName,
            contact_person: contactPerson,
            supplier_reference: params?.supplier_reference || params?.supplierReference || '',
            quote_date: new Date().toISOString(),
            parts,
            total_quote: totalQuote,
            call_notes: params?.call_notes || params?.callNotes || '',
            quote_valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }

        const supabase = await createClient()

        const { data: updatedRequest, error: updateError } = await supabase
            .from('parts_requests')
            .update({
                status: 'quoted',
                quote_provided: quoteData,
                total_estimated_price: totalQuote,
                updated_at: new Date().toISOString()
            })
            .eq('id', partsRequestId)
            .select()
            .single()

        if (updateError) {
            console.error('❌ Database update error:', updateError)
            return NextResponse.json({ error: 'Failed to save quote to database' }, { status: 500 })
        }

        // Respond in a way that your assistant can use to end the call immediately
        return NextResponse.json({
            success: true,
            message: 'Quote saved successfully',
            instruction: 'Perfect, I have everything. Thank you, goodbye.',
            end_call: true,
            quote_data: {
                total_parts: parts.length,
                total_quote: totalQuote,
                supplier: supplierName
            }
        })
    } catch (error: any) {
        console.error('❌ Error in save-parts-info:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


