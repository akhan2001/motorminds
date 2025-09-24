import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - List all parts requests across all shops (admin only)
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get the current user's session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // For now, allow any authenticated user (you can add role checking later)
        // TODO: Add proper admin role checking
        // const { data: profile } = await supabase
        //     .from('users')
        //     .select('role')
        //     .eq('id', user.id)
        //     .single()

        // if (!profile || !['admin', 'super'].includes(profile.role)) {
        //     return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        // }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const shopId = searchParams.get('shop_id')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build query - admin can see all shops
        let query = supabase
            .from('parts_requests')
            .select('*', { count: 'exact' })

        // Apply filters
        if (status) {
            query = query.eq('status', status)
        }

        if (priority) {
            query = query.eq('priority', priority)
        }

        if (shopId) {
            query = query.eq('shop_id', shopId)
        }

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: partsRequests, error, count } = await query

        if (error) {
            console.error('Error fetching admin parts requests:', error)
            return NextResponse.json({ error: 'Failed to fetch parts requests' }, { status: 500 })
        }

        return NextResponse.json({ 
            partsRequests: partsRequests || [],
            total: count || 0,
            limit,
            offset
        })

    } catch (error) {
        console.error('Admin parts requests GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
