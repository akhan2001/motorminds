// src/app/api/voice-calling/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Store active SSE connections
const activeConnections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('call_id')

    if (!callId) {
        return NextResponse.json({ error: 'Call ID is required' }, { status: 400 })
    }

    console.log('📡 Setting up SSE connection for call:', callId)

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
        start(controller) {
            // Store the controller for this call
            activeConnections.set(callId, controller)
            console.log('✅ SSE connection established for call:', callId)
            
            // Send initial connection message
            const initialMessage = `data: ${JSON.stringify({
                type: 'connection_established',
                callId: callId,
                timestamp: new Date().toISOString()
            })}\n\n`
            
            controller.enqueue(new TextEncoder().encode(initialMessage))
        },
        
        cancel() {
            // Clean up connection when client disconnects
            activeConnections.delete(callId)
            console.log('🔌 SSE connection closed for call:', callId)
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

// Function to broadcast call updates to connected clients
export function broadcastCallUpdate(callId: string, updateData: any) {
    const controller = activeConnections.get(callId)
    
    if (controller) {
        try {
            const message = `data: ${JSON.stringify(updateData)}\n\n`
            controller.enqueue(new TextEncoder().encode(message))
            console.log('📡 Broadcasted update for call:', callId, updateData.status)
        } catch (error) {
            console.error('Error broadcasting update:', error)
            // Remove broken connection
            activeConnections.delete(callId)
        }
    } else {
        console.log('🔍 No active SSE connection found for call:', callId)
    }
}