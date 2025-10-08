import { NextRequest, NextResponse } from 'next/server'
import { MiaAssistantHelper } from '@/lib/integrations/vapi/assistant-configuration'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Vapi Webhook Handler - Receives call lifecycle events
 * POST /api/voice-calling/webhook
 */
export async function POST(request: NextRequest) {
    try {

        // Check for API key in headers
        // const apiKey = request.headers.get('x-api-key')
        // const expectedApiKey = process.env.VAPI_WEBHOOK_SECRET

        // if (!apiKey || apiKey !== expectedApiKey) {
        //     console.log('❌ Invalid API key')
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // }

        // console.log ('API key validated')

        const body = await request.json()
        console.log('📨 VAPI webhook received')
        
        // Show general webhook toast
        toast.info('📨 Webhook received', {
            description: 'Processing Vapi event...'
        })

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
        
        console.log('📊 Processing call analysis')
        
        // Update the voice_calls record with basic info
        const { error: updateError } = await supabase
            .from('voice_calls')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString(),
                quote_received: analysisData?.structuredData || analysisData,
                call_metadata: {
                    ...call.metadata,
                    end_reason: call.endedReason,
                    analysis: analysisData,
                    webhook_processed_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)

        if (updateError) {
            console.error('❌ Failed to update voice call:', updateError)
        } else {
            console.log('✅ Voice call updated with webhook data')
            
            // Trigger refresh-request to do comprehensive processing
            const partsRequestId = call.metadata?.parts_request_id
            const callShopId = shopId || call.metadata?.shop_id
            
            if (partsRequestId) {
                console.log('🔄 Triggering comprehensive refresh for parts request:', partsRequestId)
                
                // Call the refresh-request endpoint internally with shop_id
                try {
                    const refreshResponse = await fetch(`/api/voice-calling/refresh-request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            parts_request_id: partsRequestId,
                            shop_id: callShopId // Pass shop_id to bypass auth
                        })
                    })
                    
                    if (refreshResponse.ok) {
                        console.log('✅ Refresh triggered successfully')
                    } else {
                        console.error('⚠️ Refresh trigger failed:', await refreshResponse.text())
                    }
                } catch (refreshError) {
                    console.error('⚠️ Error triggering refresh:', refreshError)
                    // Don't fail the webhook if refresh fails
                }
            }
        }
        
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
    
    // Show toast notification
    toast.info('📞 Call started', {
        description: `Call ID: ${call.id.slice(0, 8)}...`
    })

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
 * Handle call end event - Simplified to use refresh-request logic
 */
async function handleCallEnd(call: any, shopId?: string) {
    console.log('🏁 Call ended:', call.id, shopId ? `for shop: ${shopId}` : '')
    
    // Show toast notification
    toast.success('🏁 Call completed', {
        description: `Call ID: ${call.id.slice(0, 8)}...`
    })

    try {
        // Calculate duration
        const endedAt = new Date()
        const durationSeconds = call.startedAt 
            ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
            : null

        // Extract basic analysis data
        const analysisData = call.analysis || call.analysisResult || null
        const transcript = call.transcript || call.messages || []
        const summary = call.summary || analysisData?.summary || null

        // Update voice_calls table with basic info
        const { data: voiceCall, error: updateError } = await supabase
            .from('voice_calls')
            .update({
                status: call.endedReason === 'hangup' ? 'completed' : 'failed',
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds,
                transcript: transcript,
                call_summary: summary,
                quote_received: analysisData?.structuredData || null,
                call_metadata: {
                    ...call.metadata,
                    end_reason: call.endedReason,
                    cost: call.cost,
                    analysis: analysisData,
                    shop_id: shopId,
                    webhook_processed_at: new Date().toISOString()
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

        // Trigger refresh-request to do comprehensive processing
        if (voiceCall?.parts_request_id) {
            const callShopId = shopId || call.metadata?.shop_id
            console.log('🔄 Triggering comprehensive refresh for parts request:', voiceCall.parts_request_id)
            
            try {
                const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/voice-calling/refresh-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        parts_request_id: voiceCall.parts_request_id,
                        shop_id: callShopId // Pass shop_id to bypass auth
                    })
                })
                
                if (refreshResponse.ok) {
                    console.log('✅ Refresh triggered successfully')
                } else {
                    console.error('⚠️ Refresh trigger failed:', await refreshResponse.text())
                }
            } catch (refreshError) {
                console.error('⚠️ Error triggering refresh:', refreshError)
                // Don't fail the webhook if refresh fails
            }
        }

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
 * Handle end of call report - Simplified to use refresh-request logic
 */
async function handleEndOfCallReport(call: any, message: any, shopId?: string) {
    console.log('📊 End of call report received:', call.id, shopId ? `for shop: ${shopId}` : '')
    
    // Show toast notification
    toast.info('📊 Call analysis received', {
        description: `Processing results for call ${call.id.slice(0, 8)}...`
    })
    
    try {
        // Extract analysis data from the report
        const reportData = message.report || message.analysis || message.data || null
        const analysisData = call.analysis || reportData || null
        
        console.log('📊 Analysis data received')
        
        // Calculate duration
        const endedAt = new Date()
        const durationSeconds = call.startedAt 
            ? Math.round((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000)
            : null

        // Update voice_calls table with basic data
        const { data: voiceCall, error: updateError } = await supabase
            .from('voice_calls')
            .update({
                status: 'completed',
                ended_at: endedAt.toISOString(),
                duration_seconds: durationSeconds,
                transcript: call.transcript || [],
                call_summary: call.summary || analysisData?.summary || null,
                quote_received: analysisData?.structuredData || analysisData?.quote_details || null,
                call_metadata: {
                    ...call.metadata,
                    end_reason: call.endedReason,
                    cost: call.cost,
                    analysis: analysisData,
                    shop_id: shopId,
                    webhook_processed_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id)
            .select('parts_request_id')
            .single()

        if (updateError) {
            console.error('❌ Failed to update voice call:', updateError)
            return
        }

        console.log('✅ Voice call updated successfully')

        // Trigger refresh-request to do comprehensive processing
        const partsRequestId = voiceCall?.parts_request_id || call.metadata?.parts_request_id
        const callShopId = shopId || call.metadata?.shop_id
        
        if (partsRequestId) {
            console.log('🔄 Triggering comprehensive refresh for parts request:', partsRequestId)
            
            try {
                const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/voice-calling/refresh-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        parts_request_id: partsRequestId,
                        shop_id: callShopId // Pass shop_id to bypass auth
                    })
                })
                
                if (refreshResponse.ok) {
                    console.log('✅ Refresh triggered successfully')
                } else {
                    console.error('⚠️ Refresh trigger failed:', await refreshResponse.text())
                }
            } catch (refreshError) {
                console.error('⚠️ Error triggering refresh:', refreshError)
                // Don't fail the webhook if refresh fails
            }
        }

    } catch (error) {
        console.error('❌ Error processing end of call report:', error)
        // Note: Using polling instead of real-time SSE events
    }
}

/**
 * Handle status updates during the call (for server messages)
 */
async function handleStatusUpdate(call: any, message: any, shopId?: string) {
    console.log('📈 Status update received for call:', call?.id || 'unknown', 'Status:', message.status)
    
    // Show toast notification
    toast.info(`📈 Call status: ${message.status}`, {
        description: `Call ID: ${call?.id?.slice(0, 8) || 'unknown'}...`
    })
    
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
