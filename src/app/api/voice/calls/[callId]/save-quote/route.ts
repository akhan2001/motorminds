import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'
import { supabaseAdmin } from '@/lib/supabase-admin'

function pickStructuredAnalysis(anyCall: any) {
    const analysis = anyCall?.analysis ?? anyCall?.analysisResult ?? anyCall?.analysisResults ?? anyCall?.data?.analysis
    if (!analysis) return null

    // Common shapes: { structuredData: {...} } or flat JSON
    const structured = analysis?.structuredData ?? analysis?.structured_data ?? analysis
    return structured
}

function computeTotal(analysis: any): number | null {
    try {
        const q = analysis?.quote_details || analysis?.quoteDetails
        if (!q) return null
        if (typeof q.total_cost === 'number') return q.total_cost
        if (typeof q.unit_price === 'number') {
            const qty = analysis?.parts_info?.quantity || 1
            return q.unit_price * qty
        }
        return null
    } catch {
        return null
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ callId?: string }> }) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Server not configured: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
        }

        const { callId } = await context.params
        if (!callId) {
            return NextResponse.json({ error: 'callId is required' }, { status: 400 })
        }

        const body = await request.json().catch(() => ({}))
        const overridePartsRequestId = body?.parts_request_id as string | undefined

        // Fetch call data & analysis
        const call = await vapi.calls.get(callId as string)
        const anyCall = call as any
        const metadata = anyCall?.metadata || anyCall?.data?.metadata || {}
        const partsRequestId = overridePartsRequestId || metadata?.call_context?.parts_request_id

        if (!partsRequestId) {
            return NextResponse.json({ error: 'parts_request_id missing (not in body and not in call.metadata.call_context)' }, { status: 400 })
        }

        const structured = pickStructuredAnalysis(anyCall)
        if (!structured) {
            return NextResponse.json({ error: 'No analysis available on the call' }, { status: 404 })
        }

        const total = computeTotal(structured)

        const updatePayload: any = {
            quote_provided: structured,
            updated_at: new Date().toISOString()
        }
        if (typeof total === 'number') {
            updatePayload.total_estimated_price = total
        }
        // Best-effort set status to quoted
        updatePayload.status = 'quoted'

        const { data, error } = await supabaseAdmin
            .from('parts_requests')
            .update(updatePayload)
            .eq('id', partsRequestId)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, callId, parts_request_id: partsRequestId, quote: structured, data })
    } catch (error: any) {
        console.error('❌ save-quote error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to save quote' }, { status: 500 })
    }
}


