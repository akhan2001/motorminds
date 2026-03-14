/**
 * Shared query utilities for scope-aware data access
 *
 * Centralizes security-critical scope logic so it cannot drift between services.
 */

import type { UserAccessContext } from '@/lib/auth/access-context'

export interface ResolvedShopFilter {
    /** Shop IDs to filter by. Null means no filter (platform admin viewing all). */
    shopIds: string[] | null
}

/**
 * Resolve which shop IDs to filter by based on user access context.
 *
 * - shop: User's shop only
 * - organization: Specific shop if shopFilter provided, else all accessible org shops
 * - platform: Specific shop if shopFilter provided, else no filter (see all)
 */
export function resolveShopFilter(
    context: UserAccessContext,
    shopFilter?: string
): ResolvedShopFilter {
    // Validate shopFilter is within user's accessible shops
    if (shopFilter && !context.accessibleShopIds.includes(shopFilter)) {
        shopFilter = undefined
    }

    switch (context.accessScope) {
        case 'platform':
            if (shopFilter) {
                return { shopIds: [shopFilter] }
            }
            return { shopIds: null }

        case 'organization':
            if (shopFilter) {
                return { shopIds: [shopFilter] }
            }
            if (context.accessibleShopIds.length > 0) {
                return { shopIds: context.accessibleShopIds }
            }
            return {
                shopIds: context.shopId ? [context.shopId] : []
            }

        case 'shop':
        default:
            return {
                shopIds: context.shopId ? [context.shopId] : []
            }
    }
}

/**
 * Apply shop filter to a Supabase query.
 * When shopIds is null or empty, returns query unchanged.
 *
 * @param query - Supabase query builder
 * @param shopIds - Resolved shop IDs from resolveShopFilter
 * @param column - Column to filter on (e.g. 'shop_id' or 'customers.shop_id')
 */
export function applyShopFilterToQuery(
    query: { eq: (col: string, val: string) => any; in: (col: string, vals: string[]) => any },
    shopIds: string[] | null,
    column: string
): any {
    if (!shopIds || shopIds.length === 0) {
        return query
    }
    if (shopIds.length === 1) {
        return query.eq(column, shopIds[0])
    }
    return query.in(column, shopIds)
}
