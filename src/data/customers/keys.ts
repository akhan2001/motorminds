/**
 * React Query Keys for Customer Data
 * 
 * Centralized key management following Supabase Studio patterns.
 * Keys include scope information for proper cache isolation.
 */

export const customerKeys = {
    // Base key for all customer queries
    all: ['customers'] as const,

    // Access context key
    accessContext: () => [...customerKeys.all, 'access-context'] as const,

    // List queries with filters
    lists: () => [...customerKeys.all, 'list'] as const,
    
    list: (shopId: string, filters?: {
        scope?: string
        organizationId?: string | null
        search?: string
        shopFilter?: string
        page?: number
    }) => [...customerKeys.lists(), shopId, filters] as const,

    // Single customer queries
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (customerId: string) => [...customerKeys.details(), customerId] as const,

    // Customer history
    histories: () => [...customerKeys.all, 'history'] as const,
    history: (customerId: string) => [...customerKeys.histories(), customerId] as const,

    // Customer vehicles
    vehicles: () => [...customerKeys.all, 'vehicles'] as const,
    vehiclesList: (customerId: string) => [...customerKeys.vehicles(), customerId] as const,

    // Organization shops (for filter dropdown)
    organizationShops: (shopId: string) => [...customerKeys.all, 'organization-shops', shopId] as const,
}

/**
 * Invalidation helpers
 */
export const customerInvalidations = {
    // Invalidate all customer lists (after create/delete)
    allLists: () => customerKeys.lists(),
    
    // Invalidate specific customer's data
    customer: (customerId: string) => [
        customerKeys.detail(customerId),
        customerKeys.history(customerId),
        customerKeys.vehiclesList(customerId),
    ],
}
