import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

        // Fetch voice calls with parts_request_id for this shop
        const { data: voiceCalls, error } = await supabase
            .from('voice_calls')
            .select(`
                *,
                supplier:suppliers(id, name, contact_person),
                parts_request:parts_requests(id, status, parts_requested, vehicle_info)
            `)
            .eq('shop_id', userData.shop_id)
            .not('parts_request_id', 'is', null)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching voice calls:', error)
            return NextResponse.json({ error: 'Failed to fetch voice calls' }, { status: 500 })
        }

        return NextResponse.json({
            voiceCalls: voiceCalls || [],
            count: voiceCalls?.length || 0
        })

    } catch (error) {
        console.error('Voice calls API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
