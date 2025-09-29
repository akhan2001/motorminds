import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { vapi } from '@/lib/integrations/vapi/vapi-client'
import { orderingAssistant } from '../ordering-assistant'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { 
            callId, 
            partsRequestId, 
            phoneNumber, 
            supplierId, 
            partsInfo, 
            accountInfo,
            shopId 
        } = body

        if (!callId || !partsRequestId || !phoneNumber || !supplierId || !partsInfo || !accountInfo) {
            return NextResponse.json({ 
                error: 'Missing required fields: callId, partsRequestId, phoneNumber, supplierId, partsInfo, accountInfo' 
            }, { status: 400 })
        }

        const supabase = await createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user has access to this shop
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userDataError || !userData?.shop_id || userData.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized access to shop' }, { status: 403 })
        }

        // Get supplier information
        const { data: supplier, error: supplierError } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .eq('shop_id', shopId)
            .single()

        if (supplierError || !supplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
        }

        // Get parts request details
        const { data: partsRequest, error: partsRequestError } = await supabase
            .from('parts_requests')
            .select('*')
            .eq('id', partsRequestId)
            .eq('shop_id', shopId)
            .single()

        if (partsRequestError || !partsRequest) {
            return NextResponse.json({ error: 'Parts request not found' }, { status: 404 })
        }

        // Create a new voice call for the ordering process
        const { data: newCall, error: callError } = await supabase
            .from('voice_calls')
            .insert({
                shop_id: shopId,
                user_id: user.id,
                supplier_id: supplierId,
                phone_number: phoneNumber,
                purpose: 'parts_ordering',
                status: 'pending',
                parts_request_id: partsRequestId,
                call_metadata: {
                    ordering_call: true,
                    original_call_id: callId,
                    parts_info: partsInfo,
                    account_info: accountInfo,
                    supplier_info: {
                        name: supplier.name,
                        contact_person: supplier.contact_person,
                        phone: supplier.phone,
                        email: supplier.email
                    }
                }
            })
            .select()
            .single()

        if (callError || !newCall) {
            console.error('Error creating ordering call:', callError)
            return NextResponse.json({ error: 'Failed to create ordering call' }, { status: 500 })
        }

        // Check required environment variables
        if (!process.env.VAPI_PHONE_NUMBER_ID) {
            console.error('❌ VAPI_PHONE_NUMBER_ID environment variable is missing')
            return NextResponse.json(
                { error: 'VAPI phone number ID not configured' },
                { status: 500 }
            )
        }

        if (!process.env.VAPI_API_KEY) {
            console.error('❌ VAPI_API_KEY environment variable is missing')
            return NextResponse.json(
                { error: 'VAPI API key not configured' },
                { status: 500 }
            )
        }

        console.log('📞 Creating VAPI ordering call with:', {
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
            customerNumber: phoneNumber,
            supplierName: supplier.name
        })

        // Start the Vapi call with the ordering assistant
        try {
            const call = await vapi.calls.create({
                phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
                customer: { 
                    number: phoneNumber 
                },
                assistant: {
                    ...orderingAssistant,
                    serverMessages: ["end-of-call-report", "status-update", "hang", "tool-calls"],
                    server: {
                        url: "https://app.motorminds.ca/api/voice-calling/webhook"
                    },
                    metadata: {
                        shop_id: shopId,
                        call_id: newCall.id,
                        parts_request_id: partsRequestId,
                        supplier_id: supplierId,
                        ordering_call: true,
                        parts_info: partsInfo,
                        account_info: accountInfo
                    }
                }
            })

            // Get call ID from response
            const vapiCallId = (call as any).id || ''
            
            // Update the call with Vapi information
            const { error: updateError } = await supabase
                .from('voice_calls')
                .update({
                    vapi_call_id: vapiCallId,
                    status: 'connecting',
                    started_at: new Date().toISOString()
                })
                .eq('id', newCall.id)

            if (updateError) {
                console.error('Error updating call with Vapi data:', updateError)
            }

            return NextResponse.json({
                success: true,
                callId: newCall.id,
                vapiCallId: vapiCallId,
                message: 'Ordering call initiated successfully'
            })

        } catch (vapiError: any) {
            console.error('❌ Error starting ordering call:', vapiError)
            console.error('❌ Error details:', {
                message: vapiError.message,
                stack: vapiError.stack,
                name: vapiError.name
            })
            
            return NextResponse.json({ 
                error: 'Failed to initiate ordering call',
                details: vapiError.message,
                type: vapiError.name || 'UnknownError'
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Order parts API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
