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
                        'Authorization': `Bearer ${process.env.VAPI_API_TOKEN}`,
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

            // Update parts_requests table if we have a parts_request_id and call analysis
            if (voiceCall.parts_request_id && (vapiCallData.analysis || vapiCallData.callAnalysis)) {
                try {
                    const callAnalysis = vapiCallData.analysis || vapiCallData.callAnalysis
                    
                    // Prepare parts request update data
                    const partsRequestUpdate: any = {
                        updated_at: new Date().toISOString()
                    }

                    // Update status to 'quoted' if we have analysis
                    if (callAnalysis) {
                        partsRequestUpdate.status = 'quoted'
                        partsRequestUpdate.quote_received_at = new Date().toISOString()
                        
                        // Extract quote details if available
                        if (callAnalysis.quote_details) {
                            partsRequestUpdate.total_quote_amount = callAnalysis.quote_details.total_cost || callAnalysis.quote_details.subtotal
                            partsRequestUpdate.quote_currency = callAnalysis.quote_details.currency || 'USD'
                            partsRequestUpdate.availability = callAnalysis.quote_details.availability
                            partsRequestUpdate.delivery_eta = callAnalysis.quote_details.delivery_eta
                        }

                        // Update parts with quote information
                        if (callAnalysis.parts_info && Array.isArray(callAnalysis.parts_info)) {
                            const updatedParts = callAnalysis.parts_info.map((part: any) => ({
                                partName: part.part_name || 'Unknown Part',
                                partNumber: part.part_number || '',
                                quantity: part.quantity || 1,
                                description: part.description || '',
                                estimated_price: part.unit_price || 0,
                                supplier_part_number: part.supplier_part_number || '',
                                availability: part.availability || 'unknown',
                                delivery_days: part.delivery_days || null,
                                cost_price: part.unit_price || 0,
                                retail_price: part.unit_price || 0,
                                notes: part.notes || '',
                                vehicle_application: part.vehicle_application || '',
                                delivery_method: part.delivery_method || 'standard'
                            }))
                            
                            partsRequestUpdate.parts_requested = updatedParts
                        }

                        // Update vehicle info if available
                        if (callAnalysis.vehicle_info) {
                            partsRequestUpdate.vehicle_info = {
                                year: callAnalysis.vehicle_info.year,
                                make: callAnalysis.vehicle_info.make,
                                model: callAnalysis.vehicle_info.model,
                                engine: callAnalysis.vehicle_info.engine,
                                vin: callAnalysis.vehicle_info.vin,
                                mileage: callAnalysis.vehicle_info.mileage
                            }
                        }

                        // Update supplier info if available
                        if (callAnalysis.supplier_info && Object.keys(callAnalysis.supplier_info).length > 0) {
                            partsRequestUpdate.selected_supplier = {
                                name: callAnalysis.supplier_info.supplier_name || 'Unknown Supplier',
                                contact_person: callAnalysis.supplier_info.contact_person,
                                phone_number: callAnalysis.supplier_info.phone_number,
                                email: callAnalysis.supplier_info.email,
                                account_number: callAnalysis.supplier_info.account_number
                            }
                        }

                        // Handle next steps information
                        if (callAnalysis.next_steps) {
                            const nextSteps = callAnalysis.next_steps
                            if (nextSteps.order_ready) {
                                partsRequestUpdate.status = 'quoted' // Already set above, but ensure it's correct
                            }
                            if (nextSteps.requires_approval) {
                                partsRequestUpdate.status = 'pending' // Override if approval needed
                            }
                            if (nextSteps.follow_up_needed) {
                                partsRequestUpdate.notes = `Follow-up needed: ${nextSteps.follow_up_date || 'TBD'}`
                            }
                        }

                        // Add call analysis to notes
                        const callOutcome = callAnalysis.call_outcome
                        const outcomeNotes = callOutcome?.notes || 'Quote provided via voice call'
                        const department = callOutcome?.department ? ` (${callOutcome.department} department)` : ''
                        const status = callOutcome?.status ? ` - Status: ${callOutcome.status}` : ''
                        
                        const existingNotes = partsRequestUpdate.notes || ''
                        partsRequestUpdate.notes = `${existingNotes}\nCall analysis: ${outcomeNotes}${department}${status}`.trim()
                    }

                    // Update the parts request
                    const { data: updatedPartsRequest, error: partsRequestError } = await supabase
                        .from('parts_requests')
                        .update(partsRequestUpdate)
                        .eq('id', voiceCall.parts_request_id)
                        .eq('shop_id', userData.shop_id)
                        .select()
                        .single()

                    if (!partsRequestError && updatedPartsRequest) {
                        console.log('Updated parts request with call analysis:', {
                            partsRequestId: voiceCall.parts_request_id,
                            status: partsRequestUpdate.status,
                            totalAmount: partsRequestUpdate.total_quote_amount,
                            partsCount: partsRequestUpdate.parts_requested?.length || 0
                        })
                    } else {
                        console.error('Error updating parts request:', partsRequestError)
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
