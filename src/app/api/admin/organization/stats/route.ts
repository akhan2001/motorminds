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

        // First get all shop IDs in organization
        const { data: orgShops } = await supabase
            .from('shops')
            .select('id')
            .eq('organization_id', organizationId)
        
        const shopIds = orgShops?.map(shop => shop.id) || []

        // Get all stats in parallel
        const [shopsResult, usersResult, workOrdersResult] = await Promise.all([
            // Count shops in organization
            supabase
                .from('shops')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            
            // Count users in organization (users with shop_id that belongs to org, or users with organization_id)
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId),
            
            // Count active work orders from shops in organization
            shopIds.length > 0 ? supabase
                .from('work_orders')
                .select('id', { count: 'exact', head: true })
                .in('shop_id', shopIds)
                .eq('status', 'in_progress') : { count: 0 }
        ])

        // Get revenue from invoices for shops in organization
        let revenue = 0
        try {
            if (shopIds.length > 0) {
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('total_amount')
                    .in('shop_id', shopIds)
                
                if (invoices) {
                    revenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)
                }
            }
        } catch (error) {
            // Invoices table might not exist or have different structure
            console.warn('Could not fetch organization revenue:', error)
        }

        return NextResponse.json({
            stats: {
                totalShops: shopsResult.count || 0,
                totalUsers: usersResult.count || 0,
                organizationRevenue: revenue,
                activeWorkOrders: workOrdersResult.count || 0
            }
        })
    } catch (error) {
        console.error('Error fetching organization stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

