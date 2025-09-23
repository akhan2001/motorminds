import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'

export async function POST(request: NextRequest) {
    try {
        const headerCallId = request.headers.get('x-vapi-call-id') || request.headers.get('x-call-id')
        const body = await request.json().catch(() => ({}))
        const callId = headerCallId || body?.callId

        if (!callId) {
            return NextResponse.json({ error: 'callId missing (header x-vapi-call-id or body.callId)' }, { status: 400 })
        }

        const call = await vapi.calls.get(callId as string)
        const anyCall = call as any
        const controlUrl = anyCall?.controlUrl || anyCall?.call?.controlUrl
        if (!controlUrl) {
            return NextResponse.json({ error: 'controlUrl not found on call' }, { status: 404 })
        }

        const resp = await fetch(controlUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'end-call' })
        })
        if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            return NextResponse.json({ error: `Failed to end call via controlUrl: ${resp.status} ${text}` }, { status: 502 })
        }

        return NextResponse.json({ success: true, callId })
    } catch (error: any) {
        console.error('❌ end-call error:', error)
        return NextResponse.json({ error: error?.message || 'Failed to end call' }, { status: 500 })
    }
}


