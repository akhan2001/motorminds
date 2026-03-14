import { NextRequest, NextResponse } from 'next/server'
import { getUserAccessContextFromRequest } from '@/lib/auth/access-context'
import {
    queryVehiclesForUser,
    type VehicleQueryOptions
} from '@/lib/services/vehicle-query-service'

/**
 * GET /api/vehicles - Query vehicles with scope-aware filtering
 *
 * Query Parameters:
 * - search: Search term for year, make, model, VIN, license plate
 * - shop_id: Filter to specific shop (must be within user's accessible shops)
 * - page: Page number (1-indexed)
 * - limit: Items per page (max 100)
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest()

        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)

        const search = searchParams.get('search') || undefined
        const shopFilter = searchParams.get('shop_id') || undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const options: VehicleQueryOptions = {
            search,
            shopFilter,
            page,
            limit,
            sortBy: 'year',
            sortDirection: 'desc'
        }

        const result = await queryVehiclesForUser(context, options)

        return NextResponse.json(result)
    } catch (error) {
        console.error('GET /api/vehicles error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
