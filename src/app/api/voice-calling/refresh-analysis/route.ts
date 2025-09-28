import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const callId = searchParams.get('call_id')
        const partsRequestId = searchParams.get('parts_request_id')

        if (!callId && !partsRequestId) {
            return NextResponse.json({ error: 'Call ID or Parts Request ID required' }, { status: 400 })
        }

        const supabase = await createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's shop_id
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userDataError || !userData?.shop_id) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        let voiceCall = null

        if (callId) {
            // Fetch by vapi_call_id
            const { data, error } = await supabase
                .from('voice_calls')
                .select('*')
                .eq('vapi_call_id', callId)
                .eq('shop_id', userData.shop_id)
                .single()

            if (error) {
                return NextResponse.json({ error: 'Call not found' }, { status: 404 })
            }
            voiceCall = data
        } else if (partsRequestId) {
            // Fetch by parts_request_id
            const { data, error } = await supabase
                .from('voice_calls')
                .select('*')
                .eq('parts_request_id', partsRequestId)
                .eq('shop_id', userData.shop_id)
                .single()

            if (error) {
                return NextResponse.json({ error: 'Call not found' }, { status: 404 })
            }
            voiceCall = data
        }

        if (!voiceCall) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 })
        }

        let vapiCallData = null
        let updatedCallData = null

        // Fetch fresh data from Vapi API if we have a vapi_call_id
        if (voiceCall.vapi_call_id) {
            try {
                // Direct API call to Vapi (alternative to SDK)
                const vapiResponse = await fetch(`https://api.vapi.ai/call/${voiceCall.vapi_call_id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (vapiResponse.ok) {
                    vapiCallData = await vapiResponse.json()
                    console.log('Fetched Vapi call data:', vapiCallData)
                } else {
                    console.error('Vapi API error:', vapiResponse.status, await vapiResponse.text())
                }
            } catch (vapiError) {
                console.error('Error fetching from Vapi API:', vapiError)
                // Continue with existing data if Vapi fetch fails
            }
        }

        // Update the voice call record with fresh Vapi data if available
        if (vapiCallData) {
            const updateData: any = {
                updated_at: new Date().toISOString()
            }

            // Update status if it has changed
            if (vapiCallData.status && vapiCallData.status !== voiceCall.status) {
                updateData.status = vapiCallData.status
            }

            // Update duration if available
            if (vapiCallData.duration && vapiCallData.duration !== voiceCall.duration_seconds) {
                updateData.duration_seconds = vapiCallData.duration
            }

            // Update transcript if available
            if (vapiCallData.transcript && vapiCallData.transcript !== voiceCall.transcript) {
                updateData.transcript = vapiCallData.transcript
            }

            // Update call summary if available
            if (vapiCallData.summary && vapiCallData.summary !== voiceCall.call_summary) {
                updateData.call_summary = vapiCallData.summary
            }

            // Update timestamps
            if (vapiCallData.startedAt && vapiCallData.startedAt !== voiceCall.started_at) {
                updateData.started_at = vapiCallData.startedAt
            }

            if (vapiCallData.endedAt && vapiCallData.endedAt !== voiceCall.ended_at) {
                updateData.ended_at = vapiCallData.endedAt
            }

            // Extract call analysis from Vapi data and update quote_received
            if (vapiCallData.analysis || vapiCallData.callAnalysis) {
                const callAnalysis = vapiCallData.analysis || vapiCallData.callAnalysis
                updateData.quote_received = callAnalysis
                console.log('Updated quote_received with call analysis from Vapi:', callAnalysis)
            }

            // Update call metadata with fresh Vapi data
            updateData.call_metadata = {
                ...voiceCall.call_metadata,
                vapi_data: vapiCallData,
                last_refreshed: new Date().toISOString()
            }

            // Only update if there are changes
            if (Object.keys(updateData).length > 1) { // More than just updated_at
                const { data: updatedData, error: updateError } = await supabase
                    .from('voice_calls')
                    .update(updateData)
                    .eq('id', voiceCall.id)
                    .select()
                    .single()

                if (!updateError && updatedData) {
                    updatedCallData = updatedData
                    console.log('Updated voice call with fresh Vapi data')
                }
            }

            // Extract and save structured data to parts_request
            if (voiceCall.parts_request_id && (vapiCallData.analysis || vapiCallData.callAnalysis)) {
                try {
                    const callAnalysis = vapiCallData.analysis || vapiCallData.callAnalysis
                    
                    if (callAnalysis.structuredData) {
                        console.log('Structured data extracted:', callAnalysis.structuredData)
                        
                        // Update parts_request with structured data in quote_provided field
                        const { data: updatedPartsRequest, error: partsRequestError } = await supabase
                            .from('parts_requests')
                            .update({
                                quote_provided: callAnalysis.structuredData,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', voiceCall.parts_request_id)
                            .eq('shop_id', userData.shop_id)
                            .select()
                            .single()

                        if (!partsRequestError && updatedPartsRequest) {
                            console.log('Updated parts request with structured data:', {
                                partsRequestId: voiceCall.parts_request_id,
                                partsCount: callAnalysis.structuredData.parts_info?.length || 0,
                                totalCost: callAnalysis.structuredData.quote_details?.total_cost || 0
                            })
                        } else {
                            console.error('Error updating parts request:', partsRequestError)
                        }
                    }
                } catch (partsRequestError) {
                    console.error('Error updating parts request:', partsRequestError)
                }
            }
        }

        // Use updated data if available, otherwise use original
        const finalCallData = updatedCallData || voiceCall

        // Return the refreshed call analysis data
        return NextResponse.json({
            callId: finalCallData.vapi_call_id,
            status: finalCallData.status,
            call_analysis: finalCallData.call_metadata?.analysis || finalCallData.quote_received,
            quote_data: finalCallData.quote_received,
            call_summary: finalCallData.call_summary,
            transcript: finalCallData.transcript,
            duration: finalCallData.duration_seconds,
            started_at: finalCallData.started_at,
            ended_at: finalCallData.ended_at,
            parts_request_id: finalCallData.parts_request_id,
            vapi_data: vapiCallData,
            refreshed: !!vapiCallData,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('Refresh analysis API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
