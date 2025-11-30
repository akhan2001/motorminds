import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getAdminContext } from '@/lib/auth/admin-role-checker'

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

        // Get admin context
        const adminContext = await getAdminContext(user.id)
        
        if (!adminContext || adminContext.adminType !== 'organization-admin') {
            return NextResponse.json(
                { error: 'Forbidden - Organization admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')
        const shopId = searchParams.get('shopId') // Optional: filter by shop
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit

        // Build query using JOIN for efficiency
        let query = supabase
            .from('customers')
            .select(`
                *,
                shops:shop_id (
                    id,
                    shop_name,
                    shop_email,
                    organization_id
                )
            `, { count: 'exact' })

        // Filter by organization via shops
        // RLS policy will handle access, but we add explicit filter for clarity
        const { data: orgShops } = await supabase
            .from('shops')
            .select('id')
            .eq('organization_id', adminContext.organizationId!)

        const shopIds = orgShops?.map(s => s.id) || []
        
        if (shopIds.length === 0) {
            return NextResponse.json({ customers: [], total: 0, page, limit })
        }

        // Apply shop filter
        if (shopId && shopId !== 'all') {
            if (!shopIds.includes(shopId)) {
                return NextResponse.json(
                    { error: 'Shop not in your organization' },
                    { status: 403 }
                )
            }
            query = query.eq('shop_id', shopId)
        } else {
            query = query.in('shop_id', shopIds)
        }

        // Apply search filter
        if (search) {
            query = query.or(
                `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`
            )
        }

        // Apply pagination
        const { data: customers, error, count } = await query
            .order('customer_name', { ascending: true })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching organization customers:', error)
            return NextResponse.json(
                { error: 'Failed to fetch customers', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            customers: customers || [],
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        })

    } catch (error) {
        console.error('Error in organization customers API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}