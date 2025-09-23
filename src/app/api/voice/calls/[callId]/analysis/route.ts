import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'

export async function GET(_req: NextRequest, context: { params: { callId?: string } }) {
    try {
        const callId = context?.params?.callId
        if (!callId) {
            return NextResponse.json({ error: 'callId is required' }, { status: 400 })
        }

        const call = await vapi.calls.get(callId as string)
        const anyCall = call as any

        const analysis =
            anyCall?.analysis ??
            anyCall?.analysisResult ??
            anyCall?.analysisResults ??
            anyCall?.data?.analysis ??
            null

        return NextResponse.json({
            success: true,
            callId,
            analysis,
            call
        })
    } catch (error: any) {
        console.error('❌ get-call-analysis error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to fetch call analysis' }, { status: 500 })
    }
}


