import { NextRequest, NextResponse } from 'next/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const callId = searchParams.get('callId')
        const limit = parseInt(searchParams.get('limit') || '5')

        console.log('📞 Fetching call logs from Vapi...')

        if (callId) {
            // Fetch specific call
            console.log('🔍 Fetching specific call:', callId)
            const call = await vapi.calls.get(callId)
            
            // Transform Vapi call data to our format
            const transformedCall = transformVapiCall(call)
            return NextResponse.json(transformedCall)
        } else {
            // Fetch list of calls
            console.log('📋 Fetching call list from Vapi...')
            const calls = await vapi.calls.list({
                limit: limit
            })
            
            // Transform Vapi calls data to our format
            const transformedCalls = calls.map(transformVapiCall)
            return NextResponse.json(transformedCalls)
        }

    } catch (error: any) {
        console.error('❌ Error fetching call logs from Vapi:', error)
        
        // Handle Vapi-specific errors
        if (error.status === 401) {
            return NextResponse.json({ 
                error: 'Unauthorized - check VAPI_API_KEY environment variable',
                details: error.message 
            }, { status: 401 })
        }
        
        if (error.status === 404 && callId) {
            return NextResponse.json({ 
                error: 'Call not found',
                details: `Call ${callId} not found in Vapi` 
            }, { status: 404 })
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch call logs from Vapi',
            details: error.message 
        }, { status: 500 })
    }
}

// Transform Vapi call data to match our expected format
function transformVapiCall(vapiCall: any) {
    return {
        id: `vapi_${vapiCall.id}`,
        call_id: vapiCall.id,
        duration: vapiCall.duration ? Math.round(vapiCall.duration) : undefined,
        status: vapiCall.status || 'unknown',
        transcript: vapiCall.transcript || undefined,
        end_reason: vapiCall.endedReason || undefined,
        cost: vapiCall.cost || undefined,
        metadata: {
            vapi_data: vapiCall,
            phone_number: vapiCall.customer?.number,
            assistant_id: vapiCall.assistantId,
            started_at: vapiCall.startedAt,
            ended_at: vapiCall.endedAt,
            ...vapiCall.metadata
        },
        created_at: vapiCall.createdAt || vapiCall.startedAt || new Date().toISOString(),
        updated_at: vapiCall.updatedAt || vapiCall.endedAt || new Date().toISOString()
    }
}

// POST endpoint to manually create call log entries (for testing)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            call_id,
            duration,
            status = 'completed',
            transcript = '',
            end_reason,
            cost,
            metadata = {}
        } = body

        if (!call_id) {
            return NextResponse.json({ error: 'call_id is required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: callLog, error } = await supabase
            .from('call_logs')
            .insert({
                call_id,
                duration,
                status,
                transcript,
                end_reason,
                cost,
                metadata,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Database error:', error)
            return NextResponse.json({ 
                error: 'Failed to create call log',
                details: error.message 
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: callLog
        })

    } catch (error: any) {
        console.error('❌ Error creating call log:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 })
    }
}
