import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { MiaAssistantHelper } from '@/lib/integrations/vapi/assistant-configuration'

/**
 * Vapi Webhook Handler - Receives call lifecycle events
 * POST /api/voice-calling/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('📨 Vapi webhook received:', JSON.stringify(body, null, 2))

        const { type, call, message } = body

        if (!call?.id) {
            console.warn('⚠️ Webhook missing call ID')
            return NextResponse.json({ error: 'Missing call ID' }, { status: 400 })
        }

        const supabase = await createClient()

        // Handle different webhook event types
        switch (type) {
            case 'call-start':
                await handleCallStart(supabase, call)
                break

            case 'call-end':
                await handleCallEnd(supabase, call)
                break

            case 'function-call':
                await handleFunctionCall(supabase, call, message)
                break

            case 'transcript':
                await handleTranscriptUpdate(supabase, call, message)
                break

            case 'hang':
                await handleCallHang(supabase, call)
                break

            default:
                console.log(`📝 Unhandled webhook type: ${type}`)
                break
        }

        return NextResponse.json({ success: true, processed: type })

    } catch (error: any) {
        console.error('❌ Webhook processing error:', error)
        return NextResponse.json({ 
            error: 'Webhook processing failed',
            details: error.message 
        }, { status: 500 })
    }
}

/**
 * Handle call start event
 */
async function handleCallStart(supabase: any, call: any) {
    console.log('📞 Call started:', call.id)

    const { error } = await supabase
        .from('voice_calls')
        .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('vapi_call_id', call.id)

    if (error) {
        console.error('Failed to update call start:', error)
    }
}

/**
 * Handle call end event - This is the main event you need!
 */
async function handleCallEnd(supabase: any, call: any) {
    console.log('🏁 Call ended:', call.id)

    try {
        // Calculate duration
        const endedAt = new Date()
        const durationSeconds = call.startedAt 
            ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
            : null

        // Extract analysis data if available
        const analysisData = call.analysis || call.analysisResult || null
        const transcript = call.transcript || call.messages || []
        const summary = call.summary || analysisData?.summary || null

        // Extract structured data for parts quote
        let quoteReceived = null
        let partsDiscussed = []
        let actionsTaken = []

        if (analysisData?.structuredData) {
            quoteReceived = analysisData.structuredData
            
            // Extract parts discussed
            if (analysisData.structuredData.parts_info) {
                partsDiscussed = Array.isArray(analysisData.structuredData.parts_info) 
                    ? analysisData.structuredData.parts_info 
                    : [analysisData.structuredData.parts_info]
            }

            // Extract actions taken
            if (analysisData.structuredData.call_outcome) {
                actionsTaken.push({
                    type: 'quote_request',
                    result: analysisData.structuredData.call_outcome,
                    timestamp: endedAt.toISOString()
                })
            }
        }

        // Update voice_calls table
        const { data: voiceCall, error: updateError } = await supabase
            .from('voice_calls')
            .update({
                status: call.endedReason === 'hangup' ? 'completed' : 'failed',
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds,
                transcript: transcript,
                call_summary: summary,
                parts_discussed: partsDiscussed,
                actions_taken: actionsTaken,
                quote_received: quoteReceived,
                call_metadata: {
                    ...call.metadata,
                    end_reason: call.endedReason,
                    cost: call.cost,
                    analysis: analysisData
                },
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)
            .select('parts_request_id')
            .single()

        if (updateError) {
            console.error('Failed to update call end:', updateError)
            return
        }

        console.log('✅ Call updated successfully:', call.id)

        // If quote was received and we have a parts_request_id, update the parts request
        if (quoteReceived && voiceCall?.parts_request_id) {
            console.log('💰 Saving quote to parts request:', voiceCall.parts_request_id)

            const { error: quoteError } = await supabase
                .from('parts_requests')
                .update({
                    quote_provided: quoteReceived,
                    status: 'quoted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', voiceCall.parts_request_id)

            if (quoteError) {
                console.error('Failed to update parts request with quote:', quoteError)
            } else {
                console.log('✅ Parts request updated with quote')
            }
        }

        // Optional: Trigger real-time updates to frontend
        // You could use Supabase realtime, webhooks, or WebSocket here

    } catch (error) {
        console.error('Error processing call end:', error)
    }
}

/**
 * Handle function call events (like savePartsInfo)
 */
async function handleFunctionCall(supabase: any, call: any, message: any) {
    console.log('🔧 Function called:', message?.functionCall?.name)

    if (message?.functionCall?.name === 'savePartsInfo') {
        const partsInfo = message.functionCall.parameters

        // Add to actions_taken array
        const action = {
            type: 'save_parts_info',
            data: partsInfo,
            timestamp: new Date().toISOString()
        }

        const { error } = await supabase
            .from('voice_calls')
            .update({
                actions_taken: supabase.rpc('jsonb_append', {
                    target: 'actions_taken',
                    new_value: action
                }),
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)

        if (error) {
            console.error('Failed to update function call:', error)
        }
    }
}

/**
 * Handle transcript updates
 */
async function handleTranscriptUpdate(supabase: any, call: any, message: any) {
    // Optional: Store real-time transcript updates
    // You might want to batch these to avoid too many database writes
    console.log('📝 Transcript update for call:', call.id)
}

/**
 * Handle call hang/disconnect
 */
async function handleCallHang(supabase: any, call: any) {
    console.log('📴 Call disconnected:', call.id)

    const { error } = await supabase
        .from('voice_calls')
        .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('vapi_call_id', call.id)

    if (error) {
        console.error('Failed to update call hang:', error)
    }
}

/**
 * GET method for webhook verification (if needed by Vapi)
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        message: 'Vapi webhook endpoint active',
        assistant: MiaAssistantHelper.getAssistantId()
    })
}
