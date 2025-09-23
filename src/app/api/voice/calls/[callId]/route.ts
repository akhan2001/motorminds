import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'

export async function GET(_req: NextRequest, context: { params: Promise<{ callId?: string }> }) {
    try {
        const { callId } = await context.params
        if (!callId) {
            return NextResponse.json({ error: 'callId is required' }, { status: 400 })
        }

        const call = await vapi.calls.get(callId)
        return NextResponse.json({ success: true, call })
    } catch (error: any) {
        console.error('❌ get-call error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to fetch call' }, { status: 500 })
    }
}


