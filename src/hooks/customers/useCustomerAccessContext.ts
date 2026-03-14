/**
 * Client-side hook for customer access context
 * 
 * Following Supabase Studio's useSelectedOrganizationQuery pattern.
 * Fetches and caches the user's access context for customer operations.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { customerKeys } from '@/data/customers/keys'
import type { AccessScope } from '@/lib/auth/access-context'

export interface ClientAccessContext {
    userId?: string
    shopId: string | null
    organizationId: string | null
    accessScope: AccessScope
    role: string
    canEdit: boolean
    canDelete: boolean
    availableShops: Array<{ id: string; shop_name: string }>
}

export interface OrganizationCheckResponse {
    hasOrganizationAccess: boolean
    organizationId: string | null
    accessScope: AccessScope
    shopId: string | null
    availableShops: Array<{ id: string; shop_name: string }>
    role: string
}

/**
 * Hook to get the current user's customer access context
 * 
 * @param enabled - Whether to fetch the context (default: true)
 * @returns Access context with loading/error states
 */
export function useCustomerAccessContext(enabled = true) {
    const { 
        data, 
        isLoading, 
        isSuccess, 
        error,
        refetch 
    } = useQuery<OrganizationCheckResponse>({
        queryKey: customerKeys.accessContext(),
        queryFn: async () => {
            const res = await fetch('/api/customers/organization-check')
            if (!res.ok) {
                throw new Error('Failed to fetch access context')
            }
            return res.json()
        },
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes - access context doesn't change often
        gcTime: 10 * 60 * 1000, // 10 minutes
    })

    // Transform to ClientAccessContext
    const accessContext = useMemo<ClientAccessContext | undefined>(() => {
        if (!data) return undefined

        // Derive permissions from role
        const permissions = getClientPermissions(data.role)

        return {
            shopId: data.shopId,
            organizationId: data.organizationId,
            accessScope: data.accessScope,
            role: data.role,
            availableShops: data.availableShops,
            ...permissions
        }
    }, [data])

    // Computed helpers
    const hasOrganizationAccess = data?.hasOrganizationAccess ?? false
    const showShopFilter = hasOrganizationAccess && (data?.availableShops?.length ?? 0) > 1
    const showShopColumn = hasOrganizationAccess

    return {
        accessContext,
        isLoading,
        isSuccess,
        error,
        refetch,
        // Convenience properties
        hasOrganizationAccess,
        showShopFilter,
        showShopColumn,
        availableShops: data?.availableShops ?? [],
        accessScope: data?.accessScope ?? 'shop',
    }
}

/**
 * Determine client-side permissions based on role
 * Mirrors server-side logic in access-context.ts
 */
function getClientPermissions(role: string): { canEdit: boolean; canDelete: boolean } {
    const normalizedRole = role?.toUpperCase() || ''
    
    if (normalizedRole === 'SUPER-ADMIN' || normalizedRole === 'SUPER_ADMIN') {
        return { canEdit: true, canDelete: true }
    }
    
    if (normalizedRole === 'ADMIN' || normalizedRole === 'ORGANIZATION_ADMIN' || normalizedRole === 'SHOP_ADMIN') {
        return { canEdit: true, canDelete: true }
    }
    
    if (normalizedRole === 'OWNER') {
        return { canEdit: true, canDelete: true }
    }
    
    if (normalizedRole === 'MANAGER') {
        return { canEdit: true, canDelete: false }
    }
    
    return { canEdit: false, canDelete: false }
}

export default useCustomerAccessContext

/** Alias for useCustomerAccessContext - use for vehicle, shop, or org-scoped pages */
export const useAccessContext = useCustomerAccessContext
