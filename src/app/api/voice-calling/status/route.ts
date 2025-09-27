import { createClient } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

// src/app/api/voice-calling/status/route.ts
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get('call_id')
    const partsRequestId = searchParams.get('parts_request_id')
    
    try {
        const supabase = await createClient()
        
        if (callId) {
            // Get call status by VAPI call ID
            const { data: call, error } = await supabase
                .from('voice_calls')
                .select('*')
                .eq('vapi_call_id', callId)
                .single()
            
            if (error) {
                return NextResponse.json({ error: 'Call not found' }, { status: 404 })
            }
            
            // Optimized status mapping
            const statusMap: Record<string, string> = {
                'ringing': 'ringing',
                'in-progress': 'in_progress', 
                'completed': 'completed',
                'error': 'failed',
                'timeout': 'failed',
                'failed': 'failed'
            }
            const mappedStatus = statusMap[call.status] || call.status

            return NextResponse.json({
                callId: call.vapi_call_id,
                status: mappedStatus,
                startedAt: call.started_at,
                endedAt: call.ended_at,
                duration: call.duration_seconds,
                endedReason: call.call_metadata?.end_reason,
                analysis: call.call_analysis,
                transcript: call.transcript,
                summary: call.call_summary,
                quoteData: call.quote_received,
                partsFound: call.parts_discussed,
                actionsTaken: call.actions_taken,
                error: call.call_metadata?.error,
                cost: call.call_metadata?.cost,
                partsRequestId: call.parts_request_id,
                shopId: call.shop_id,
                metadata: {
                    createdAt: call.created_at,
                    updatedAt: call.updated_at
                }
            })
        }
        
        if (partsRequestId) {
            // Get parts request status
            const { data: partsRequest, error } = await supabase
                .from('parts_requests')
                .select('*')
                .eq('id', partsRequestId)
                .single()
            
            if (error) {
                return NextResponse.json({ error: 'Parts request not found' }, { status: 404 })
            }
            
            return NextResponse.json({
                status: partsRequest.status,
                quote_provided: partsRequest.quote_provided,
                call_analysis: partsRequest.call_analysis,
                actual_cost: partsRequest.actual_cost,
                supplier_info: partsRequest.supplier_info
            })
        }
        
        return NextResponse.json({ error: 'Call ID or Parts Request ID required' }, { status: 400 })
        
    } catch (error) {
        console.error('Status endpoint error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}