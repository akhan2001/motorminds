import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext } from '@/lib/auth/admin-role-checker'

export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured')
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }

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
        
        if (!adminContext || (adminContext.adminType !== 'organization-admin' && adminContext.adminType !== 'super-admin')) {
            return NextResponse.json(
                { error: 'Forbidden - Organization admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.trim()
        const shopIdParam = searchParams.get('shop_id') // Optional: filter by shop(s) - comma separated
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit

        // Parse shop IDs if provided (comma-separated)
        const shopIds = shopIdParam ? shopIdParam.split(',').filter(id => id.trim()) : []


        // Get organization shops first (using admin client for efficiency)
        let shopsQuery = supabaseAdmin
            .from('shops')
            .select('id, shop_name')
            
        // For super-admin, allow access to all organizations, otherwise filter by organization
        if (adminContext.adminType === 'super-admin') {
            // Super admin can see all shops, but we still need an organization filter
            // Check if organizationId is provided in query params for super-admin
            const orgIdParam = searchParams.get('organizationId')
            if (orgIdParam) {
                shopsQuery = shopsQuery.eq('organization_id', orgIdParam)
            } else if (adminContext.organizationId) {
                shopsQuery = shopsQuery.eq('organization_id', adminContext.organizationId)
            }
        } else {
            // Organization admin - filter by their organization
            shopsQuery = shopsQuery.eq('organization_id', adminContext.organizationId!)
        }
        
        const { data: orgShops, error: shopsError } = await shopsQuery

        if (shopsError) {
            console.error('Error fetching organization shops:', shopsError)
            return NextResponse.json(
                { error: 'Failed to fetch organization shops' },
                { status: 500 }
            )
        }

        const orgShopIds = orgShops?.map(s => s.id) || []
        
        if (orgShopIds.length === 0) {
            return NextResponse.json({ customers: [], total: 0, page, limit, totalPages: 0 })
        }

        // Determine which shops to query based on filter
        let targetShopIds = orgShopIds
        if (shopIds.length > 0) {
            // Validate that all requested shop IDs belong to the organization
            const invalidShopIds = shopIds.filter(id => !orgShopIds.includes(id))
            if (invalidShopIds.length > 0) {
                return NextResponse.json(
                    { error: 'Some shops not in your organization' },
                    { status: 403 }
                )
            }
            targetShopIds = shopIds
        }

        // Build optimized query using admin client (bypasses RLS)
        let query = supabaseAdmin
            .from('customers')
            .select(`
                id,
                customer_name,
                customer_email,
                customer_phone,
                customer_address,
                shop_id,
                created_at,
                updated_at,
                notes,
                shops:shop_id (
                    id,
                    shop_name,
                    shop_email
                )
            `, { count: 'exact' })

        // Apply shop filter first (most selective)
        query = query.in('shop_id', targetShopIds)

        // Apply optimized search filter (following customer search patterns)
        if (search && search.length >= 1) {
            if (search.match(/^\+?[\d\s()-]+$/)) {
                // Phone number search - use indexed phone column for fast lookups
                const cleanPhone = search.replace(/\D/g, '')
                query = query.ilike('customer_phone', `%${cleanPhone}%`)
            } else if (search.includes('@')) {
                // Email search - direct column match
                query = query.ilike('customer_email', `%${search}%`)
            } else if (search.length >= 2) {
                // Multi-field search with OR condition for better performance
                query = query.or(
                    `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_address.ilike.%${search}%`
                )
            } else {
                // Short queries - use simple ILIKE on name only
                query = query.ilike('customer_name', `%${search}%`)
            }
        }

        // Apply pagination and ordering
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

        // Client-side relevance scoring for search results (only if searching)
        let finalCustomers = customers || []
        
        if (search && search.length >= 2) {
            const scoredCustomers = finalCustomers.map(customer => {
                let score = 0
                const lowerQuery = search.toLowerCase()
                const lowerName = customer.customer_name?.toLowerCase() || ''

                // Boost exact matches
                if (lowerName === lowerQuery) score += 100
                // Boost name starts with query
                else if (lowerName.startsWith(lowerQuery)) score += 50
                // Boost name contains query
                else if (lowerName.includes(lowerQuery)) score += 25

                // Boost if email matches
                if (customer.customer_email?.toLowerCase().includes(lowerQuery)) score += 30

                // Boost if phone matches
                if (customer.customer_phone?.includes(search.replace(/\D/g, ''))) score += 40

                // Boost if address matches
                if (customer.customer_address?.toLowerCase().includes(lowerQuery)) score += 15
                
                return { ...customer, _score: score }
            }).sort((a, b) => b._score - a._score)

            // Remove the score from the response
            finalCustomers = scoredCustomers.map(({ _score, ...customer }) => customer)
        }

        const totalPages = Math.ceil((count || 0) / limit)

        return NextResponse.json({
            customers: finalCustomers,
            total: count || 0,
            page,
            limit,
            totalPages,
            query: search || null
        })

    } catch (error) {
        console.error('Error in organization customers API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}