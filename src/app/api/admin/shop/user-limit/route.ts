import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user's shop_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id, role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify user is shop admin
        const userRole = userData.role?.toUpperCase()
        const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id
        
        if (!isShopAdmin || !userData.shop_id) {
            return NextResponse.json(
                { error: 'Forbidden - Shop admin access required' },
                { status: 403 }
            )
        }

        const shopId = userData.shop_id
        const MAX_ADDITIONAL_USERS = 2 // Shop admin + 2 others = 3 total
        const MAX_TOTAL_USERS = 3

        // Count users in shop (excluding the shop admin themselves)
        const { count: totalCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)

        // Users excluding shop admin
        const usersExcludingAdmin = (totalCount || 0) - 1
        const remaining = Math.max(0, MAX_ADDITIONAL_USERS - usersExcludingAdmin)
        const canCreate = remaining > 0

        return NextResponse.json({
            limit: MAX_ADDITIONAL_USERS,
            maxTotal: MAX_TOTAL_USERS,
            current: usersExcludingAdmin,
            remaining,
            canCreate
        })
    } catch (error) {
        console.error('Error fetching user limit:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

