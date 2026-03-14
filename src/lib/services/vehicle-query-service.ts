/**
 * Unified Vehicle Query Service
 *
 * Scope-aware vehicle queries based on user access context.
 * Vehicles are scoped via their owning customer's shop.
 */

import { createClient } from '@/utils/supabase/server'
import type { UserAccessContext, AccessScope } from '@/lib/auth/access-context'
import { resolveShopFilter, applyShopFilterToQuery } from './query-utils'

export interface VehicleQueryOptions {
    /** Search term for year, make, model, VIN, license plate */
    search?: string
    /** Filter by specific shop ID (must be within user's accessible shops) */
    shopFilter?: string
    /** Page number (1-indexed) */
    page?: number
    /** Items per page (max 100) */
    limit?: number
    /** Sort field */
    sortBy?: 'year' | 'make' | 'model' | 'created_at'
    /** Sort direction */
    sortDirection?: 'asc' | 'desc'
}

export interface VehicleWithContext {
    id: string
    year?: number
    make?: string
    model?: string
    vin?: string
    license_plate?: string
    color?: string
    engine_type?: string
    mileage?: number
    customer_id: string
    created_at?: string
    updated_at?: string
    /** Customer name (from join) */
    customer_name?: string
    /** Whether this vehicle's customer belongs to the user's current shop */
    isFromCurrentShop: boolean
    /** The shop name (for organization/platform scope) */
    shopName: string | null
}

export interface PaginatedVehiclesResponse {
    vehicles: VehicleWithContext[]
    total: number
    page: number
    limit: number
    totalPages: number
    accessScope: AccessScope
    organizationId: string | null
}

/**
 * Query vehicles based on user access context.
 * Scope is derived from the owning customer's shop.
 */
export async function queryVehiclesForUser(
    context: UserAccessContext,
    options: VehicleQueryOptions = {}
): Promise<PaginatedVehiclesResponse> {
    const supabase = await createClient()

    const {
        search,
        shopFilter,
        page = 1,
        limit = 50,
        sortBy = 'year',
        sortDirection = 'desc'
    } = options

    const safeLimit = Math.min(limit, 100)
    const offset = (page - 1) * safeLimit

    // Build base query: customer_vehicles with inner join to customers for scope
    // customer_vehicles has no updated_at; year is text in schema
    let query = supabase
        .from('customer_vehicles')
        .select(
            `
            id,
            year,
            make,
            model,
            vin,
            license_plate,
            color,
            engine_type,
            mileage,
            customer_id,
            created_at,
            customers!inner(
                shop_id,
                customer_name,
                organization_id,
                shops:shop_id(shop_name)
            )
        `,
            { count: 'exact' }
        )

    // Apply scope via customers.shop_id
    const { shopIds } = resolveShopFilter(context, shopFilter)
    if (shopIds && shopIds.length > 0) {
        if (shopIds.length === 1) {
            query = query.eq('customers.shop_id', shopIds[0])
        } else {
            query = query.in('customers.shop_id', shopIds)
        }
    }

    // Apply search
    if (search && search.trim().length >= 2) {
        const trimmed = search.trim()
        const escaped = trimmed.replace(/'/g, "''")
        const orParts: string[] = [
            `make.ilike.%${escaped}%`,
            `model.ilike.%${escaped}%`,
            `vin.ilike.%${escaped}%`,
            `license_plate.ilike.%${escaped}%`
        ]
        // Match year if search is numeric (year is text in schema)
        const yearNum = parseInt(trimmed, 10)
        if (!isNaN(yearNum) && String(yearNum) === trimmed) {
            orParts.push(`year.eq.${trimmed}`)
        }
        query = query.or(orParts.join(','))
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const rangeEnd = offset + safeLimit - 1
    query = query.range(offset, rangeEnd)

    const { data: rows, error, count } = await query

    if (error) {
        console.error('Vehicle query error:', error)
        throw new Error(`Failed to fetch vehicles: ${error.message}`)
    }

    const vehicles: VehicleWithContext[] = (rows || []).map((row: any) => {
        const customers = row.customers
        const shopId = customers?.shop_id
        const shopName = customers?.shops?.shop_name ?? null

        return {
            id: row.id,
            year: row.year != null ? parseInt(String(row.year), 10) : undefined,
            make: row.make,
            model: row.model,
            vin: row.vin,
            license_plate: row.license_plate,
            color: row.color,
            engine_type: row.engine_type,
            mileage: row.mileage != null ? Number(row.mileage) : undefined,
            customer_id: row.customer_id,
            created_at: row.created_at,
            customer_name: customers?.customer_name || null,
            isFromCurrentShop: shopId === context.shopId,
            shopName
        }
    })

    const totalPages = Math.ceil((count || 0) / safeLimit)

    return {
        vehicles,
        total: count || 0,
        page,
        limit: safeLimit,
        totalPages,
        accessScope: context.accessScope,
        organizationId: context.organizationId
    }
}
