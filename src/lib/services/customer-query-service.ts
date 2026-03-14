/**
 * Unified Customer Query Service
 * 
 * This service provides scope-aware customer queries based on user access context.
 * It centralizes all customer data access logic for consistency and security.
 */

import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { 
    type UserAccessContext, 
    type AccessScope,
    canAccessScope 
} from '@/lib/auth/access-context'
import { resolveShopFilter, applyShopFilterToQuery } from './query-utils'

export interface CustomerQueryOptions {
    /** Search term for name, email, phone, etc. */
    search?: string
    /** Phone number filter */
    phone?: string
    /** Filter by specific shop ID (must be within user's accessible shops) */
    shopFilter?: string
    /** Page number (1-indexed) */
    page?: number
    /** Items per page (max 100) */
    limit?: number
    /** Sort field */
    sortBy?: 'created_at' | 'updated_at' | 'customer_name'
    /** Sort direction */
    sortDirection?: 'asc' | 'desc'
}

export interface PaginatedCustomersResponse {
    customers: CustomerWithContext[]
    total: number
    page: number
    limit: number
    totalPages: number
    accessScope: AccessScope
    organizationId: string | null
}

export interface CustomerWithContext {
    id: string
    customer_name: string
    customer_email: string | null
    customer_phone: string | null
    customer_address: string | null
    customer_vehicle: any
    license_plate: string | null
    tags: string[] | null
    shop_id: string
    organization_id: string | null
    created_at: string
    updated_at: string
    notes: string | null
    customer_source: string | null
    /** Whether this customer belongs to the user's current shop */
    isFromCurrentShop: boolean
    /** The shop name (for organization/platform scope) */
    shopName: string | null
}

/**
 * Query customers based on user access context
 * 
 * Access logic:
 * - 'shop' scope: Only customers from user's shop
 * - 'organization' scope: Customers from all shops in user's organization
 * - 'platform' scope: All customers (super admin only)
 */
export async function queryCustomersForUser(
    context: UserAccessContext,
    options: CustomerQueryOptions = {}
): Promise<PaginatedCustomersResponse> {
    const supabase = await createClient()
    
    const {
        search,
        phone,
        shopFilter,
        page = 1,
        limit = 50,
        sortBy = 'created_at',
        sortDirection = 'desc'
    } = options

    // Clamp limit to max 100
    const safeLimit = Math.min(limit, 100)
    const offset = (page - 1) * safeLimit

    // Build base query
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

    // Apply scope-based filtering
    const { shopIds } = resolveShopFilter(context, shopFilter)
    query = applyShopFilterToQuery(query, shopIds, 'shop_id') as typeof query

    // Phone search by digits: use RPC so "(365) 889-0136" matches "3658890136"
    let phoneMatchIds: string[] | null = null
    if (!phone && search && search.trim().length >= 2 && search.trim().match(/^\+?[\d\s()-]+$/)) {
        const digits = search.trim().replace(/\D/g, '')
        if (digits.length >= 2) {
            const { data: ids, error: rpcError } = await supabase.rpc('search_customer_ids_by_phone', {
                digits,
                shop_ids: context.accessibleShopIds.length > 0 ? context.accessibleShopIds : [context.shopId].filter(Boolean)
            })
            if (!rpcError && ids && Array.isArray(ids) && ids.length > 0) {
                phoneMatchIds = ids as string[]
            }
        }
    }

    // Vehicle license plate search: always run when search has 2+ chars
    let vehicleMatchIds: string[] = []
    if (!phone && search && search.trim().length >= 2) {
        vehicleMatchIds = await getCustomerIdsByVehicleLicensePlate(supabase, search, context, shopFilter)
    }

    // Apply search filters
    if (phone) {
        // Exact phone number search
        query = query.eq('customer_phone', phone)
    } else if (phoneMatchIds !== null && phoneMatchIds.length > 0) {
        // Restrict to ids from phone RPC (digits match)
        query = query.in('id', phoneMatchIds)
    } else if (search && search.length >= 2) {
        query = applySearchFilter(query, search, vehicleMatchIds)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDirection === 'asc' })

    // Apply pagination: when using phone RPC, count is from ids length
    const rangeEnd = offset + safeLimit - 1
    query = query.range(offset, rangeEnd)

    const { data: customers, error, count } = await query

    if (error) {
        console.error('Customer query error:', error)
        throw new Error('Failed to fetch customers')
    }

    // Transform results with context
    const customersWithContext: CustomerWithContext[] = (customers || []).map(customer => ({
        id: customer.id,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
        customer_address: customer.customer_address,
        customer_vehicle: customer.customer_vehicle,
        license_plate: customer.license_plate,
        tags: customer.tags,
        shop_id: customer.shop_id,
        organization_id: customer.organization_id,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        notes: customer.notes,
        customer_source: customer.customer_source,
        isFromCurrentShop: customer.shop_id === context.shopId,
        shopName: (customer as any).shops?.shop_name || null
    }))

    const totalPages = Math.ceil((count || 0) / safeLimit)

    return {
        customers: customersWithContext,
        total: count || 0,
        page,
        limit: safeLimit,
        totalPages,
        accessScope: context.accessScope,
        organizationId: context.organizationId
    }
}

const VEHICLE_LICENSE_PLATE_MATCH_LIMIT = 500

/**
 * Get customer IDs whose vehicles have a matching license plate.
 * Filters by shop scope. Returns up to 500 IDs.
 */
async function getCustomerIdsByVehicleLicensePlate(
    supabase: SupabaseClient,
    search: string,
    context: UserAccessContext,
    shopFilter?: string
): Promise<string[]> {
    try {
        const trimmedSearch = search.trim()
        if (trimmedSearch.length < 2) return []

        const { data: vehicles, error: vehiclesError } = await supabase
            .from('customer_vehicles')
            .select('customer_id')
            .ilike('license_plate', `%${trimmedSearch}%`)
            .limit(1000)

        if (vehiclesError || !vehicles?.length) return []

        const customerIds = [...new Set(vehicles.map((v: { customer_id: string }) => v.customer_id))].slice(0, VEHICLE_LICENSE_PLATE_MATCH_LIMIT)
        if (customerIds.length === 0) return []

        const { shopIds } = resolveShopFilter(context, shopFilter)
        if (!shopIds || shopIds.length === 0) return customerIds

        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id')
            .in('id', customerIds)
            .in('shop_id', shopIds)

        if (customersError) return []
        return (customers || []).map((c: { id: string }) => c.id)
    } catch (err) {
        console.error('getCustomerIdsByVehicleLicensePlate error:', err)
        return []
    }
}

/**
 * Apply search filter based on search term type.
 * Phone search (digits-only) is handled via RPC above; here we handle formatted phone and other types.
 * When vehicleMatchIds is non-empty, includes id.in.(...) so customers found via vehicle license plate are included.
 */
function applySearchFilter(query: any, search: string, vehicleMatchIds: string[] = []): any {
    const trimmedSearch = search.trim()
    const escapedSearch = trimmedSearch.replace(/'/g, "''")

    const orParts: string[] = []

    if (vehicleMatchIds.length > 0) {
        orParts.push(`id.in.(${vehicleMatchIds.join(',')})`)
    }

    // Phone number pattern: match by digits so formatted DB values like "(365) 889-0136" match "3658890136"
    if (trimmedSearch.match(/^\+?[\d\s()-]+$/)) {
        const cleanPhone = trimmedSearch.replace(/\D/g, '')
        orParts.push(`customer_phone.ilike.%${escapedSearch}%`, `customer_phone.ilike.%${cleanPhone}%`)
        return query.or(orParts.join(','))
    }

    // Email pattern
    if (trimmedSearch.includes('@')) {
        orParts.push(`customer_email.ilike.%${escapedSearch}%`)
        return query.or(orParts.join(','))
    }

    // General search (name, email, phone, license plate, address)
    orParts.push(
        `customer_name.ilike.%${escapedSearch}%`,
        `customer_email.ilike.%${escapedSearch}%`,
        `customer_phone.ilike.%${escapedSearch}%`,
        `license_plate.ilike.%${escapedSearch}%`,
        `customer_address.ilike.%${escapedSearch}%`
    )
    return query.or(orParts.join(','))
}

/**
 * Get a single customer by ID with access control
 */
export async function getCustomerById(
    context: UserAccessContext,
    customerId: string
): Promise<CustomerWithContext | null> {
    const supabase = await createClient()

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
        `)
        .eq('id', customerId)

    // Apply access control
    if (context.accessScope === 'shop') {
        query = query.eq('shop_id', context.shopId)
    } else if (context.accessScope === 'organization' && context.organizationId) {
        // Use OR logic to include customers from current shop even without organization_id
        query = query.or(`organization_id.eq.${context.organizationId},shop_id.eq.${context.shopId}`)
    }
    // Platform scope has no additional filter

    const { data: customer, error } = await query.single()

    if (error || !customer) {
        return null
    }

    return {
        ...customer,
        isFromCurrentShop: customer.shop_id === context.shopId,
        shopName: (customer as any).shops?.shop_name || null
    }
}

/**
 * Create a new customer with proper organization_id population
 */
export async function createCustomer(
    context: UserAccessContext,
    customerData: {
        customer_name: string
        customer_email?: string | null
        customer_phone?: string | null
        customer_address?: string | null
        customer_vehicle?: any
        license_plate?: string | null
        notes?: string | null
        tags?: string[]
    }
): Promise<{ success: boolean; customer?: any; error?: string }> {
    const supabase = await createClient()

    if (!context.shopId) {
        return { success: false, error: 'No shop context' }
    }

    // Check for duplicate phone number
    if (customerData.customer_phone) {
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('shop_id', context.shopId)
            .eq('customer_phone', customerData.customer_phone)
            .maybeSingle()

        if (existingCustomer) {
            return { success: false, error: 'Customer with this phone number already exists' }
        }
    }

    // Create customer with proper organization_id denormalization
    const { data: customer, error } = await supabase
        .from('customers')
        .insert({
            shop_id: context.shopId,
            organization_id: context.organizationId, // Denormalize org ID for efficient queries
            customer_name: customerData.customer_name,
            customer_email: customerData.customer_email || null,
            customer_phone: customerData.customer_phone || null,
            customer_address: customerData.customer_address || null,
            customer_vehicle: customerData.customer_vehicle || null,
            license_plate: customerData.license_plate || null,
            notes: customerData.notes || null,
            tags: customerData.tags || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to create customer:', error)
        return { success: false, error: 'Failed to create customer' }
    }

    return { success: true, customer }
}

/**
 * Update a customer with access control
 */
export async function updateCustomer(
    context: UserAccessContext,
    customerId: string,
    updates: Partial<{
        customer_name: string
        customer_email: string | null
        customer_phone: string | null
        customer_address: string | null
        customer_vehicle: any
        license_plate: string | null
        notes: string | null
        tags: string[]
    }>
): Promise<{ success: boolean; customer?: any; error?: string }> {
    const supabase = await createClient()

    // Verify access to this customer
    const existingCustomer = await getCustomerById(context, customerId)
    if (!existingCustomer) {
        return { success: false, error: 'Customer not found or access denied' }
    }

    // For organization scope, only allow editing customers from own shop
    if (context.accessScope === 'organization' && !existingCustomer.isFromCurrentShop) {
        return { success: false, error: 'Can only edit customers from your own shop' }
    }

    const { data: customer, error } = await supabase
        .from('customers')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
        .select()
        .single()

    if (error) {
        console.error('Failed to update customer:', error)
        return { success: false, error: 'Failed to update customer' }
    }

    return { success: true, customer }
}
