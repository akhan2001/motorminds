import { NextRequest, NextResponse } from 'next/server'

const activeConnections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('call_id')

    if (!callId) {
        return NextResponse.json({ error: 'Call ID required' }, { status: 400 })
    }

    const stream = new ReadableStream({
        start(controller) {
            activeConnections.set(callId, controller)
            const initialMessage = `data: ${JSON.stringify({
                type: 'connection_established',
                callId,
                timestamp: new Date().toISOString()
            })}\n\n`
            controller.enqueue(new TextEncoder().encode(initialMessage))
        },
        cancel() {
            activeConnections.delete(callId)
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        }
    })
}

export function broadcastCallUpdate(callId: string, updateData: any) {
    const controller = activeConnections.get(callId)
    
    if (controller) {
        try {
            const message = `data: ${JSON.stringify(updateData)}\n\n`
            controller.enqueue(new TextEncoder().encode(message))
            
            // Log call completion broadcasts
            if (updateData.status === 'completed' || updateData.type === 'call_completed') {
                console.log('📡 BROADCASTING CALL COMPLETION:', {
                    callId,
                    status: updateData.status,
                    analysis: updateData.analysis || updateData.quote_data,
                    timestamp: new Date().toISOString()
                })
            }
        } catch (error) {
            activeConnections.delete(callId)
        }
    }
}