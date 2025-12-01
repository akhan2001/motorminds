import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.trim()
        const organizationWide = searchParams.get('organization_wide') === 'true'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit

        const supabase = await createClient()

        // Get user's shop and organization info
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        if (shopError) {
            console.error('Failed to get shop data:', shopError)
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        const organizationId = shopData?.organization_id

        // Build customer query with organization support
        let query = supabase
            .from('customers')
            .select(`
                id,
                customer_name,
                customer_email,
                customer_phone,
                customer_address,
                customer_vehicle,
                license_plate,
                tags,
                shop_id,
                organization_id,
                created_at,
                updated_at,
                notes,
                customer_source,
                shops:shop_id (
                    id,
                    shop_name
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        // Apply organization-aware filtering
        if (organizationWide && organizationId) {
            // MSO shop: show customers from same organization
            // The RLS policies will handle the access control
            query = query.eq('organization_id', organizationId)
        } else {
            // Non-MSO shop or shop-only mode: filter by current shop
            query = query.eq('shop_id', shopId)
        }

        // Apply search filter if provided
        if (search && search.length >= 2) {
            if (search.match(/^\+?[\d\s()-]+$/)) {
                // Phone number search
                const cleanPhone = search.replace(/\D/g, '')
                query = query.ilike('customer_phone', `%${cleanPhone}%`)
            } else if (search.includes('@')) {
                // Email search
                query = query.ilike('customer_email', `%${search}%`)
            } else {
                // Name/general search
                query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,license_plate.ilike.%${search}%,customer_address.ilike.%${search}%`)
            }
        }

        const { data: customers, error, count } = await query

        if (error) {
            console.error('Customer search error:', error)
            return NextResponse.json({ error: 'Search failed' }, { status: 500 })
        }

        // Add organization context to results
        const customersWithContext = (customers || []).map(customer => ({
            ...customer,
            isFromCurrentShop: customer.shop_id === shopId,
            shopName: (customer as any).shops?.shop_name
        }))

        const totalPages = Math.ceil((count || 0) / limit)

        return NextResponse.json({
            customers: customersWithContext,
            total: count || 0,
            page,
            limit,
            totalPages,
            organizationId: organizationWide ? organizationId : null
        })

    } catch (error) {
        console.error('Customer organization API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
