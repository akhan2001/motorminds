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

        // Get user's organization_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify user is organization admin
        const userRole = userData.role?.toUpperCase()
        const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && userData.organization_id
        
        if (!isOrgAdmin || !userData.organization_id) {
            return NextResponse.json(
                { error: 'Forbidden - Organization admin access required' },
                { status: 403 }
            )
        }

        const organizationId = userData.organization_id
        const MAX_USERS = 3

        // Count users created by this organization admin
        // For now, we'll count all users in the organization (directly linked or through shops)
        // In a production system, you might want to track a creator_id field
        const { data: orgShops } = await supabase
            .from('shops')
            .select('id')
            .eq('organization_id', organizationId)

        const shopIds = orgShops?.map(shop => shop.id) || []

        // Count users directly linked to organization
        const { count: directCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)

        // Count users linked through shops (excluding the org admin themselves)
        const { count: shopCount } = shopIds.length > 0 ? await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .in('shop_id', shopIds)
            .is('organization_id', null)
            .neq('id', user.id) : { count: 0 }

        // For simplicity, we'll use a conservative approach:
        // Count all users in organization (this includes the org admin)
        // The limit is 3 additional users, so we check if total users (excluding org admin) < 3
        const totalUsers = (directCount || 0) + (shopCount || 0)
        const usersExcludingAdmin = totalUsers - 1 // Subtract the org admin themselves
        const remaining = Math.max(0, MAX_USERS - usersExcludingAdmin)
        const canCreate = remaining > 0

        return NextResponse.json({
            limit: MAX_USERS,
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

