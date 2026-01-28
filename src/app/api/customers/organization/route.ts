import { NextRequest, NextResponse } from 'next/server'
import { getUserAccessContextFromRequest } from '@/lib/auth/access-context'
import { queryCustomersForUser, type CustomerQueryOptions } from '@/lib/services/customer-query-service'

/**
 * GET /api/customers/organization - Query customers with organization-aware filtering
 * 
 * This endpoint is maintained for backwards compatibility.
 * It uses the same underlying service as /api/customers.
 * 
 * Query Parameters:
 * - search: Search term
 * - organization_wide: 'true' to search across organization (default behavior for MSO)
 * - shop_id: Filter to specific shop
 * - page: Page number
 * - limit: Items per page
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest()
        
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.trim() || undefined
        const shopFilter = searchParams.get('shop_id') || undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

        // Build query options
        const options: CustomerQueryOptions = {
            search,
            shopFilter,
            page,
            limit,
            sortBy: 'created_at',
            sortDirection: 'desc'
        }

        // Query customers using the unified service
        const result = await queryCustomersForUser(context, options)

        // Return in the legacy format for backwards compatibility
        return NextResponse.json({
            customers: result.customers,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            organizationId: result.organizationId
        })

    } catch (error) {
        console.error('Customer organization API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
