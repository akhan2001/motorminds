import { NextRequest, NextResponse } from 'next/server'
import { MiaAssistantHelper } from '@/lib/integrations/vapi/assistant-configuration'
import { broadcastCallUpdate } from '@/app/api/voice-calling/events/route'
import { supabase } from '@/lib/supabase'

/**
 * Vapi Webhook Handler - Receives call lifecycle events
 * POST /api/voice-calling/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('📨 VAPI webhook received:', JSON.stringify(body, null, 2))

        // Handle different webhook structures
        // Option 1: Direct message type (as per VAPI example)
        if (body.message?.type) {
            const { call } = body.message
            const messageType = body.message.type
            
            console.log('📩 Processing server message:', messageType)
            
            // Extract shop context
            const shopId = call?.metadata?.shop_id
            
            switch (messageType) {
                case 'assistant-request':
                    return handleAssistantRequest(call, body.message)
                    
                case 'end-of-call-report':
                    return handleCallEndReport(call, body.message, shopId)
                    
                case 'status-update':
                    return handleStatusUpdate(call, body.message, shopId)
                    
                default:
                    console.log('📝 Unhandled server message type:', messageType)
                    return NextResponse.json({ success: true })
            }
        }

        // Option 2: Standard webhook events (call lifecycle)
        const { type, call, message } = body

        if (!call?.id) {
            console.warn('⚠️ Webhook missing call ID')
            return NextResponse.json({ error: 'Missing call ID' }, { status: 400 })
        }

        // Extract shop context from call metadata
        const shopId = call.metadata?.shop_id
        if (!shopId) {
            console.warn('⚠️ No shop_id in call metadata')
        }

        // Handle different webhook event types with shop context
        switch (type) {
            case 'call-start':
                await handleCallStart(call, shopId)
                break

            case 'call-end':
                await handleCallEnd(call, shopId)
                break

            case 'function-call':
                await handleFunctionCall(call, message, shopId)
                break

            case 'transcript':
                await handleTranscriptUpdate(call, message, shopId)
                break

            case 'hang':
                await handleCallHang(call, shopId)
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

async function handleAssistantRequest(call: any, message: any) {
    console.log('🔍 Assistant request received:', message.id, call.id)

    return NextResponse.json({
        messageResponse: {
            assistant: {
                name: "Mia Parts Sourcing Assistant",
                firstMessage: "Hello! I'm Mia, your parts sourcing assistant. How can I help you today?",
                endCallMessage: "Thank you for calling. Goodbye!",
                endCallPhrases: ["goodbye", "talk to you soon"]
            }
        }
    })
}

async function handleCallEndReport(call: any, message: any, shopId?: string) {
    console.log('🏁 End of call report received for call:', call?.id || 'unknown')
    
    try {
        
        // Extract call analysis data from the message
        const analysisData = message.analysis || message.structuredData || call?.analysis || null
        
        if (!analysisData) {
            console.warn('⚠️ No analysis data in end-of-call-report')
            return NextResponse.json({ success: true, note: 'No analysis data' })
        }
        
        console.log('📊 Processing call analysis:', JSON.stringify(analysisData, null, 2))
        
        // Process the end of call report using the existing comprehensive handler
        await handleEndOfCallReport(call, { analysis: analysisData }, shopId)
        
        return NextResponse.json({ success: true, processed: 'end_of_call_report' })
        
    } catch (error) {
        console.error('❌ Error processing end-of-call-report:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to process end-of-call-report' 
        }, { status: 500 })
    }
}


/**
 * Handle call start event
 */
async function handleCallStart(call: any, shopId?: string) {
    console.log('📞 Call started:', call.id, shopId ? `for shop: ${shopId}` : '')

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
async function handleCallEnd(call: any, shopId?: string) {
    console.log('🏁 Call ended:', call.id, shopId ? `for shop: ${shopId}` : '')

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
                    analysis: analysisData,
                    shop_id: shopId
                },
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)
            .select('parts_request_id, shop_id')
            .single()

        if (updateError) {
            console.error('Failed to update call end:', updateError)
            return
        }

        console.log('✅ Call updated successfully:', call.id)

        // If quote was received and we have a parts_request_id, update the parts request
        if (quoteReceived && voiceCall?.parts_request_id) {
            console.log('💰 Saving quote to parts request:', voiceCall.parts_request_id)

            // Store both quote_provided and call_analysis for comprehensive data
            const { error: quoteError } = await supabase
                .from('parts_requests')
                .update({
                    quote_provided: quoteReceived,
                    call_analysis: analysisData?.structuredData || null,
                    status: 'quoted',
                    updated_at: new Date().toISOString()
                })
                .eq('id', voiceCall.parts_request_id)

            if (quoteError) {
                console.error('Failed to update parts request with quote:', quoteError)
            } else {
                console.log('✅ Parts request updated with quote and analysis')
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
async function handleFunctionCall(call: any, message: any, shopId?: string) {
    console.log('🔧 Function called:', message?.functionCall?.name, shopId ? `for shop: ${shopId}` : '')

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
async function handleTranscriptUpdate(call: any, message: any, shopId?: string) {
    // Optional: Store real-time transcript updates
    // You might want to batch these to avoid too many database writes
    console.log('📝 Transcript update for call:', call.id, shopId ? `for shop: ${shopId}` : '')
}

/**
 * Handle call hang/disconnect
 */
async function handleCallHang(call: any, shopId?: string) {
    console.log('📴 Call disconnected:', call.id, shopId ? `for shop: ${shopId}` : '')

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
 * Handle end of call report (most important function)
 */
async function handleEndOfCallReport(call: any, message: any, shopId?: string) {
    console.log('📊 End of call report received:', call.id, shopId ? `for shop: ${shopId}` : '')
    
    try {
        // Extract analysis data from the report
        const reportData = message.report || message.analysis || message.data || null
        const analysisData = call.analysis || reportData || null
        
        console.log('📊 Analysis data received:', JSON.stringify(analysisData, null, 2))
        
        // Calculate duration
        const endedAt = new Date()
        const durationSeconds = call.startedAt 
            ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
            : null

        // Update voice_calls table with comprehensive data
        const { data: voiceCall, error: updateError } = await supabase
            .from('voice_calls')
            .update({
                status: 'completed',
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds,
                transcript: call.transcript || [],
                call_summary: call.summary || analysisData?.summary || null,
                call_analysis: analysisData,
                quote_received: analysisData?.structuredData || analysisData?.quote_details || null,
                call_metadata: {
                    ...call.metadata,
                    end_reason: call.endedReason,
                    cost: call.cost,
                    analysis: analysisData,
                    shop_id: shopId
                },
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)
            .select()

        if (updateError) {
            console.error('❌ Failed to update voice call:', updateError)
            return
        }

        console.log('✅ Voice call updated successfully:', voiceCall)

        // Update parts_request if we have a parts_request_id and analysis data
        const partsRequestId = call.metadata?.parts_request_id
        if (partsRequestId && analysisData?.structuredData) {
            const structuredData = analysisData.structuredData
            
            const { error: partsError } = await supabase
                .from('parts_requests')
                .update({
                    status: 'quote_received',
                    quote_provided: structuredData,
                    call_analysis: analysisData,
                    actual_cost: structuredData.quote_details?.total_cost || null,
                    supplier_info: structuredData.supplier_info || {},
                    admin_notes: `Call completed. Analysis: ${analysisData.summary || 'No summary'}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', partsRequestId)

            if (partsError) {
                console.error('❌ Failed to update parts request:', partsError)
            } else {
                console.log('✅ Parts request updated with quote data')
                
                // Broadcast real-time update to connected clients
                broadcastCallUpdate(call.id, {
                    type: 'call_completed',
                    status: 'completed',
                    callId: call.id,
                    quote_data: structuredData,
                    timestamp: new Date().toISOString()
                })
            }
        }

    } catch (error) {
        console.error('❌ Error processing end of call report:', error)
        
        // Broadcast failure update
        broadcastCallUpdate(call.id, {
            type: 'call_failed',
            status: 'failed',
            callId: call.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        })
    }
}

/**
 * Handle status updates during the call (for server messages)
 */
async function handleStatusUpdate(call: any, message: any, shopId?: string) {
    console.log('📈 Status update received for call:', call?.id || 'unknown', 'Status:', message.status)
    
    try {
        
        // Update call status in real-time
        const { error } = await supabase
            .from('voice_calls')
            .update({
                status: message.status || 'in_progress',
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)

        if (error) {
            console.error('Failed to update call status:', error)
        }
        
        return NextResponse.json({ success: true, processed: 'status_update' })
        
    } catch (error) {
        console.error('❌ Error processing status update:', error)
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to process status update' 
        }, { status: 500 })
    }
}

/**
 * GET method for webhook verification (if needed by Vapi)
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({ 
        message: 'Vapi webhook endpoint active',
        assistant: MiaAssistantHelper.getAssistantId(),
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    })
}
