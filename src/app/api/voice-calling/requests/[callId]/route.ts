import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { callId: string } }
) {
    try {
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

        const { callId } = params

        // Fetch specific voice call with all related data
        const { data: voiceCall, error } = await supabase
            .from('voice_calls')
            .select(`
                *,
                supplier:suppliers(id, name, contact_person, phone_number, email),
                parts_request:parts_requests(
                    id, 
                    status, 
                    parts_requested, 
                    vehicle_info,
                    customer_info,
                    quote_provided,
                    call_analysis,
                    actual_cost,
                    supplier_info
                )
            `)
            .eq('id', callId)
            .eq('shop_id', userData.shop_id)
            .single()

        if (error) {
            console.error('Error fetching voice call:', error)
            return NextResponse.json({ error: 'Failed to fetch voice call' }, { status: 500 })
        }

        if (!voiceCall) {
            return NextResponse.json({ error: 'Voice call not found' }, { status: 404 })
        }

        return NextResponse.json({
            call: voiceCall
        })

    } catch (error) {
        console.error('Voice call API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
