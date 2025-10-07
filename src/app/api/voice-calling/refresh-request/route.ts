import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Refresh all supplier calls for a parts request
 * Fetches latest status from Vapi and aggregates results
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { parts_request_id } = body

        if (!parts_request_id) {
            return NextResponse.json({ error: 'Parts Request ID required' }, { status: 400 })
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

        // Fetch all voice calls for this parts request
        const { data: voiceCalls, error: callsError } = await supabase
            .from('voice_calls')
            .select('*')
            .eq('parts_request_id', parts_request_id)
            .eq('shop_id', userData.shop_id)
            .order('sequence_number')

        if (callsError) {
            return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
        }

        if (!voiceCalls || voiceCalls.length === 0) {
            return NextResponse.json({ error: 'No calls found' }, { status: 404 })
        }

        console.log(`📞 Refreshing ${voiceCalls.length} supplier call(s) for parts request: ${parts_request_id}`)

        // Refresh each call from Vapi
        const refreshPromises = voiceCalls.map(async (call) => {
            if (!call.vapi_call_id) {
                return {
                    call_id: call.id,
                    supplier_id: call.supplier_id,
                    supplier_name: call.supplier_name,
                    status: call.status,
                    refreshed: false,
                    error: 'No Vapi call ID'
                }
            }

            try {
                // Fetch from Vapi API
                const vapiResponse = await fetch(`https://api.vapi.ai/call/${call.vapi_call_id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!vapiResponse.ok) {
                    console.error(`Vapi API error for call ${call.id}:`, vapiResponse.status)
                    return {
                        call_id: call.id,
                        supplier_id: call.supplier_id,
                        supplier_name: call.supplier_name,
                        status: call.status,
                        refreshed: false,
                        error: `Vapi API error: ${vapiResponse.status}`
                    }
                }

                const vapiCallData = await vapiResponse.json()
                console.log(`✅ Fetched Vapi data for call ${call.id} (${call.supplier_name})`)

                // Prepare update data
                const updateData: any = {
                    updated_at: new Date().toISOString()
                }

                // Update status based on Vapi data
                if (vapiCallData.status) {
                    updateData.status = vapiCallData.status
                }

                // Update duration
                if (vapiCallData.duration) {
                    updateData.duration_seconds = vapiCallData.duration
                }

                // Update timestamps
                if (vapiCallData.startedAt) {
                    updateData.started_at = vapiCallData.startedAt
                }

                if (vapiCallData.endedAt) {
                    updateData.ended_at = vapiCallData.endedAt
                }

                // Update transcript
                if (vapiCallData.transcript) {
                    updateData.transcript = vapiCallData.transcript
                }

                // Process call analysis
                if (vapiCallData.analysis || vapiCallData.callAnalysis) {
                    const callAnalysis = vapiCallData.analysis || vapiCallData.callAnalysis
                    updateData.quote_received = callAnalysis

                    // Determine call status based on analysis
                    if (callAnalysis.successEvaluation !== undefined) {
                        if (callAnalysis.successEvaluation === true || callAnalysis.successEvaluation === 'true') {
                            updateData.status = 'completed'
                        } else {
                            updateData.status = 'failed'
                        }
                    }

                    // Check call outcome
                    if (callAnalysis.call_outcome && callAnalysis.call_outcome.status) {
                        const outcomeStatus = callAnalysis.call_outcome.status.toLowerCase()
                        
                        if (outcomeStatus === 'voicemail' || outcomeStatus === 'no_answer' || outcomeStatus === 'busy') {
                            updateData.status = 'failed'
                        } else if (outcomeStatus === 'success' || outcomeStatus === 'completed') {
                            updateData.status = 'completed'
                        }
                    }
                }

                // Update call metadata
                updateData.call_metadata = {
                    ...call.call_metadata,
                    vapi_data: vapiCallData,
                    last_refreshed: new Date().toISOString()
                }

                // Update the voice_calls record
                const { data: updatedCall, error: updateError } = await supabase
                    .from('voice_calls')
                    .update(updateData)
                    .eq('id', call.id)
                    .select()
                    .single()

                if (updateError) {
                    console.error(`Error updating call ${call.id}:`, updateError)
                    return {
                        call_id: call.id,
                        supplier_id: call.supplier_id,
                        supplier_name: call.supplier_name,
                        status: call.status,
                        refreshed: false,
                        error: 'Database update failed'
                    }
                }

                return {
                    call_id: updatedCall.id,
                    supplier_id: updatedCall.supplier_id,
                    supplier_name: updatedCall.supplier_name,
                    status: updatedCall.status,
                    refreshed: true,
                    quote_received: updatedCall.quote_received
                }

            } catch (error: any) {
                console.error(`Error refreshing call ${call.id}:`, error)
                return {
                    call_id: call.id,
                    supplier_id: call.supplier_id,
                    supplier_name: call.supplier_name,
                    status: call.status,
                    refreshed: false,
                    error: error.message
                }
            }
        })

        // Wait for all refreshes to complete
        const results = await Promise.all(refreshPromises)

        // Aggregate status counts
        const statusCounts = results.reduce((acc, result) => {
            const status = result.status
            acc[status] = (acc[status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const completedSuppliers = statusCounts.completed || 0
        const failedSuppliers = statusCounts.failed || 0
        const totalSuppliers = results.length

        console.log(`📊 Status aggregation:`, {
            completed: completedSuppliers,
            failed: failedSuppliers,
            total: totalSuppliers
        })

        // Determine overall parts request status
        let overallStatus = 'pending'
        if (completedSuppliers === totalSuppliers) {
            overallStatus = 'quoted' // All suppliers responded successfully
        } else if (completedSuppliers > 0) {
            overallStatus = 'processing' // Some responses received
        } else if (failedSuppliers === totalSuppliers) {
            overallStatus = 'pending' // All failed, allow retry
        }

        // Calculate total estimated price from all successful quotes
        let totalEstimatedPrice = 0
        let latestQuoteReceived = null
        let latestCallId = null
        let updatedPartsRequested = null
        
        console.log('\n🔍 ===== STARTING PRICE CALCULATION =====')
        console.log(`📞 Processing ${results.length} call result(s)`)
        
        for (const result of results) {
            console.log(`\n📊 Checking call ${result.call_id} (${result.supplier_name}):`)
            console.log(`   Status: ${result.status}`)
            console.log(`   Has quote_received: ${!!result.quote_received}`)
            
            if (result.status === 'completed' && result.quote_received) {
                const quoteData = result.quote_received
                console.log(`   ✅ Quote data found:`, JSON.stringify(quoteData, null, 2))
                
                // Extract price from various possible paths
                let price = 0
                
                // Check if data is in structuredData or at root level
                const actualData = quoteData.structuredData || quoteData
                console.log(`   🔍 Using data from: ${quoteData.structuredData ? 'structuredData' : 'root'}`)
                
                // First try to sum up individual parts from parts_info array
                if (actualData.parts_info && Array.isArray(actualData.parts_info)) {
                    console.log(`   📦 Found parts_info array with ${actualData.parts_info.length} part(s)`)
                    price = actualData.parts_info.reduce((sum: number, part: any, index: number) => {
                        const partPrice = part.total_price || part.unit_price || 0
                        console.log(`      Part ${index + 1}: ${part.part_name} - $${partPrice}`)
                        return sum + (typeof partPrice === 'number' ? partPrice : parseFloat(partPrice) || 0)
                    }, 0)
                    console.log(`   💵 Sum from parts_info: $${price}`)
                }
                
                // Fallback to other price fields
                if (price === 0) {
                    console.log(`   ⚠️  No price from parts_info, checking fallback fields...`)
                    const fallbackPrice = 
                        actualData.quote_details?.total_cost || 
                        actualData.quote_details?.subtotal ||
                        actualData.total_cost ||
                        actualData.subtotal ||
                        actualData.price ||
                        0
                    
                    console.log(`   📌 Fallback price found: $${fallbackPrice}`)
                    console.log(`      - quote_details.total_cost: ${actualData.quote_details?.total_cost}`)
                    console.log(`      - quote_details.subtotal: ${actualData.quote_details?.subtotal}`)
                    console.log(`      - total_cost: ${actualData.total_cost}`)
                    console.log(`      - subtotal: ${actualData.subtotal}`)
                    console.log(`      - price: ${actualData.price}`)
                    
                    price = fallbackPrice
                }
                
                if (price > 0) {
                    const parsedPrice = typeof price === 'string' 
                        ? parseFloat(String(price).replace(/[^0-9.]/g, '')) 
                        : (typeof price === 'number' ? price : 0)
                    
                    console.log(`   ✨ Parsed price: $${parsedPrice}`)
                    
                    if (!isNaN(parsedPrice)) {
                        totalEstimatedPrice += parsedPrice
                        latestQuoteReceived = quoteData
                        latestCallId = result.call_id
                        console.log(`   ✅ Added to total. Running total: $${totalEstimatedPrice}`)
                        
                        // Update parts_requested with quoted prices from latest successful call
                        if (actualData.parts_info && Array.isArray(actualData.parts_info)) {
                            updatedPartsRequested = actualData.parts_info.map((part: any) => ({
                                part_name: part.part_name || part.partName || '',
                                part_number: part.part_number || part.partNumber || '',
                                quantity: part.quantity || 1,
                                estimated_price: part.unit_price || part.estimated_price || 0,
                                description: part.description || part.vehicle_application || '',
                                supplier_part_number: part.part_number || '',
                                brand: part.brand || '',
                                availability: part.availability || 'unknown'
                            }))
                            console.log(`   📝 Updated parts_requested array:`, JSON.stringify(updatedPartsRequested, null, 2))
                        }
                    } else {
                        console.log(`   ❌ Price is NaN, skipping`)
                    }
                } else {
                    console.log(`   ⚠️  No valid price found for this call`)
                }
            }
        }

        console.log(`\n💰 ===== FINAL CALCULATION =====`)
        console.log(`💵 Total Estimated Price: $${totalEstimatedPrice}`)
        console.log(`📦 Parts Requested Update: ${updatedPartsRequested ? 'Yes' : 'No'}`)
        console.log(`🆔 Latest Call ID: ${latestCallId}`)
        console.log(`📋 Latest Quote Data: ${latestQuoteReceived ? 'Yes' : 'No'}`)
        if (updatedPartsRequested) {
            console.log(`📦 Updated parts info from call analysis:`, JSON.stringify(updatedPartsRequested, null, 2))
        }
        console.log('===================================\n')

        // Prepare update data for parts_request
        const partsRequestUpdate: any = {
            supplier_info: {
                selected_suppliers: results.map(r => ({
                    id: r.supplier_id,
                    name: r.supplier_name
                })),
                total_suppliers: totalSuppliers,
                completed_suppliers: completedSuppliers,
                failed_suppliers: failedSuppliers
            },
            status: overallStatus,
            updated_at: new Date().toISOString()
        }

        // Update estimated price if we have quotes
        if (totalEstimatedPrice > 0) {
            partsRequestUpdate.total_estimated_price = totalEstimatedPrice
            partsRequestUpdate.actual_cost = totalEstimatedPrice
            console.log(`💵 Setting total_estimated_price: $${totalEstimatedPrice}`)
            console.log(`💵 Setting actual_cost: $${totalEstimatedPrice}`)
        }

        // Update parts_requested with quoted information
        if (updatedPartsRequested) {
            partsRequestUpdate.parts_requested = updatedPartsRequested
            console.log(`📦 Updating parts_requested array with ${updatedPartsRequested.length} part(s)`)
        }

        // Update quote_provided with latest call analysis
        if (latestQuoteReceived) {
            partsRequestUpdate.quote_provided = latestQuoteReceived
            partsRequestUpdate.call_analysis = latestQuoteReceived
            console.log(`📋 Setting quote_provided and call_analysis`)
        }

        // Update voice_call_id to the latest successful call
        if (latestCallId) {
            partsRequestUpdate.voice_call_id = latestCallId
            console.log(`🆔 Setting voice_call_id: ${latestCallId}`)
        }

        console.log(`\n📝 ===== PARTS REQUEST UPDATE =====`)
        console.log(`📋 Update payload:`, JSON.stringify(partsRequestUpdate, null, 2))
        console.log(`🎯 Target parts_request_id: ${parts_request_id}`)
        console.log(`🏪 Target shop_id: ${userData.shop_id}`)
        console.log('===================================\n')

        // Update parts_request with aggregated data
        const { data: partsRequest, error: partsRequestError } = await supabase
            .from('parts_requests')
            .update(partsRequestUpdate)
            .eq('id', parts_request_id)
            .eq('shop_id', userData.shop_id)
            .select()
            .single()

        if (partsRequestError) {
            console.error('❌ Error updating parts request:', partsRequestError)
        } else {
            console.log(`\n✅ ===== SUCCESS =====`)
            console.log(`✅ Updated parts request ${parts_request_id}`)
            console.log(`📊 New status: ${overallStatus}`)
            console.log(`💰 New total_estimated_price: $${partsRequest?.total_estimated_price || 0}`)
            console.log(`📦 Parts count: ${partsRequest?.parts_requested?.length || 0}`)
            console.log(`🎉 Update complete!`)
            console.log('======================\n')
        }

        return NextResponse.json({
            success: true,
            parts_request_id,
            results,
            aggregated_status: {
                overall_status: overallStatus,
                completed_suppliers: completedSuppliers,
                failed_suppliers: failedSuppliers,
                total_suppliers: totalSuppliers
            },
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('Refresh request API error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

