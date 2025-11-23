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

        // Get all stats in parallel
        const [usersResult, workOrdersResult, invoicesResult] = await Promise.all([
            // Count users in shop
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', shopId),
            
            // Count active work orders
            supabase
                .from('work_orders')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .eq('status', 'in_progress'),
            
            // Get revenue from invoices
            supabase
                .from('invoices')
                .select('total_amount')
                .eq('shop_id', shopId)
        ])

        // Calculate revenue
        let revenue = 0
        if (invoicesResult.data) {
            revenue = invoicesResult.data.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)
        }

        // Count parts inventory (if parts table exists)
        let partsInventory = 0
        try {
            const { count } = await supabase
                .from('parts')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
            
            partsInventory = count || 0
        } catch (error) {
            // Parts table might not exist
            console.warn('Could not fetch parts inventory:', error)
        }

        return NextResponse.json({
            stats: {
                totalUsers: usersResult.count || 0,
                shopRevenue: revenue,
                activeWorkOrders: workOrdersResult.count || 0,
                partsInventory
            }
        })
    } catch (error) {
        console.error('Error fetching shop stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

