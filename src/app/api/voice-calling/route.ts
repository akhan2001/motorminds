import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createMiaCall } from '@/lib/integrations/vapi/vapi-client'
import { MiaAssistantHelper } from '@/lib/integrations/vapi/assistant-configuration'
import { formatPhoneNumberE164, isValidE164 } from '@/utils/format-phone'

/**
 * Main Voice Calling API - Start a Mia AI call using pre-configured assistant
 * POST /api/voice-calling
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            phone_number,
            supplier_name,
            supplier_contact_person,
            vehicle_info,
            parts_info,
            shop_id,
            parts_request_id
        } = body

        // Validate required fields
        if (!phone_number) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        if (!supplier_name) {
            return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
        }

        // Format and validate phone number
        const formattedPhone = formatPhoneNumberE164(phone_number)
        if (!isValidE164(formattedPhone)) {
            return NextResponse.json({ 
                error: 'Invalid phone number format. Must be a valid E.164 number' 
            }, { status: 400 })
        }

        // Get authenticated user
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch shop information if shop_id provided
        let shopInfo = {
            name: 'MotorMinds Auto Shop',
            account_numbers: { general: 'MM-2024' }
        }

        if (shop_id) {
            const { data: shop } = await supabase
                .from('shops')
                .select('name, account_numbers')
                .eq('id', shop_id)
                .single()
            
            if (shop) {
                shopInfo = {
                    name: shop.name || 'MotorMinds Auto Shop',
                    account_numbers: shop.account_numbers || { general: 'MM-2024' }
                }
            }
        }

        // Build call context for the assistant
        const callContext = {
            shop_info: shopInfo,
            supplier_info: {
                name: supplier_name,
                contact_person: supplier_contact_person,
                phone_number: formattedPhone
            },
            vehicle_info: vehicle_info || {},
            parts_info: parts_info || {},
            parts_request_id,
            user_id: user.id,
            created_at: new Date().toISOString()
        }

        console.log('🤖 Starting Mia AI call with context:', callContext)

        // Create the call using the pre-configured assistant
        const call = await createMiaCall(formattedPhone, callContext)

        // Log the call in database
        const { error: insertError } = await supabase
            .from('voice_calls')
            .insert({
                shop_id: shop_id || null,
                user_id: user.id,
                supplier_name,
                phone_number: formattedPhone,
                vapi_call_id: call.id,
                assistant_type: 'mia_parts_requesting',
                call_context: callContext,
                status: 'initiated',
                created_at: new Date().toISOString()
            })

        if (insertError) {
            console.warn('Failed to log call in database:', insertError)
        }

        return NextResponse.json({
            success: true,
            call_id: call.id,
            assistant_id: MiaAssistantHelper.getAssistantId(),
            message: 'Mia AI call initiated successfully',
            context: {
                supplier: supplier_name,
                phone: formattedPhone,
                shop: shopInfo.name
            }
        })

    } catch (error: any) {
        console.error('❌ Voice calling error:', error)
        return NextResponse.json({ 
            error: error.message || 'Failed to initiate voice call' 
        }, { status: 500 })
    }
}

/**
 * Get voice call status and history
 * GET /api/voice-calling
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const callId = searchParams.get('call_id')
        const shopId = searchParams.get('shop_id')
        const limit = parseInt(searchParams.get('limit') || '10')

        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get specific call if call_id provided
        if (callId) {
            const { data: call, error } = await supabase
                .from('voice_calls')
                .select('*')
                .eq('vapi_call_id', callId)
                .eq('user_id', user.id)
                .single()

            if (error) {
                return NextResponse.json({ error: 'Call not found' }, { status: 404 })
            }

            return NextResponse.json({ call })
        }

        // Get call history
        let query = supabase
            .from('voice_calls')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (shopId) {
            query = query.eq('shop_id', shopId)
        }

        const { data: calls, error } = await query

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
        }

        return NextResponse.json({ calls })

    } catch (error: any) {
        console.error('❌ Get voice calls error:', error)
        return NextResponse.json({ 
            error: 'Failed to fetch voice calls' 
        }, { status: 500 })
    }
}
