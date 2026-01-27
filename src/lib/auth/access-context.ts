/**
 * Unified Access Context for Multi-Tenant Customer Access
 * 
 * This module provides a centralized way to determine user access scope
 * based on their role, shop, and organization membership.
 * 
 * Access Scopes:
 * - 'shop': Individual shop users - can only see their shop's data
 * - 'organization': MSO users - can see data from all shops in their organization
 * - 'platform': Super admins - can see all data across all organizations
 */

import { createClient } from '@/utils/supabase/server'

export type AccessScope = 'shop' | 'organization' | 'platform'

export type UserRole = 
    | 'SUPER-ADMIN' 
    | 'SUPER_ADMIN' 
    | 'ADMIN' 
    | 'ORGANIZATION_ADMIN' 
    | 'SHOP_ADMIN' 
    | 'owner' 
    | 'manager' 
    | 'employee' 
    | 'user'

export interface UserAccessContext {
    userId: string
    shopId: string | null
    organizationId: string | null
    accessScope: AccessScope
    role: string
    /** All shop IDs the user can access (for organization/platform scope) */
    accessibleShopIds: string[]
    /** Whether user can edit customers */
    canEdit: boolean
    /** Whether user can delete customers */
    canDelete: boolean
}

export interface CustomerPermissions {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    /** Can edit customers from other shops (for org scope) */
    canEditOtherShops: boolean
}

/**
 * Determines edit/delete permissions based on role
 * Following Supabase's action-based permission pattern
 */
export function determinePermissions(role: string): { canEdit: boolean; canDelete: boolean } {
    const normalizedRole = role?.toUpperCase() || ''
    
    // Super admins and admins have full access
    if (normalizedRole === 'SUPER-ADMIN' || normalizedRole === 'SUPER_ADMIN') {
        return { canEdit: true, canDelete: true }
    }
    
    if (normalizedRole === 'ADMIN' || normalizedRole === 'ORGANIZATION_ADMIN' || normalizedRole === 'SHOP_ADMIN') {
        return { canEdit: true, canDelete: true }
    }
    
    // Owners can edit and delete
    if (normalizedRole === 'OWNER') {
        return { canEdit: true, canDelete: true }
    }
    
    // Managers can edit but not delete
    if (normalizedRole === 'MANAGER') {
        return { canEdit: true, canDelete: false }
    }
    
    // Employees and users can view only
    return { canEdit: false, canDelete: false }
}

/**
 * Get full customer permissions for a specific customer
 */
export function getCustomerPermissions(
    context: UserAccessContext,
    customer: { shop_id: string; isFromCurrentShop?: boolean }
): CustomerPermissions {
    const basePermissions = determinePermissions(context.role)
    
    // Can always view if within scope
    const canView = true
    
    // For organization scope: can only edit/delete own shop's customers
    const isOwnShop = customer.shop_id === context.shopId || customer.isFromCurrentShop
    const canEditOtherShops = context.accessScope === 'platform' // Only platform can edit other shops
    
    const canEdit = basePermissions.canEdit && (isOwnShop || canEditOtherShops)
    const canDelete = basePermissions.canDelete && (isOwnShop || canEditOtherShops)
    
    return {
        canView,
        canEdit,
        canDelete,
        canEditOtherShops,
    }
}

export interface Shop {
    id: string
    organization_id: string | null
    shop_name: string
}

export interface User {
    id: string
    role: string | null
    shop_id: string | null
    organization_id: string | null
}

/**
 * Determines the access scope based on user role and shop/organization membership
 * 
 * Priority order:
 * 1. Super Admin → platform access
 * 2. Organization Admin (explicit org assignment) → organization access
 * 3. MSO Shop User (shop belongs to org) → organization access
 * 4. Individual Shop User → shop access
 */
export function determineAccessScope(
    user: User,
    shop: Shop | null
): AccessScope {
    const userRole = user.role?.toUpperCase() || ''

    // 1. Super Admin - platform access (all data)
    if (userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN') {
        return 'platform'
    }

    // 2. Organization Admin (explicit org assignment on user)
    if (user.organization_id && (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN')) {
        return 'organization'
    }

    // 3. MSO Shop User (shop belongs to an organization)
    if (shop?.organization_id) {
        return 'organization'
    }

    // 4. Individual Shop User (default)
    return 'shop'
}

/**
 * Checks if a user can access a specific scope
 * Higher scopes can access lower scopes
 */
export function canAccessScope(
    currentScope: AccessScope,
    requestedScope: AccessScope
): boolean {
    const scopeHierarchy: Record<AccessScope, number> = {
        'shop': 1,
        'organization': 2,
        'platform': 3
    }

    return scopeHierarchy[currentScope] >= scopeHierarchy[requestedScope]
}

/**
 * Gets the full user access context from the database
 * This is the primary entry point for determining user access
 */
export async function getUserAccessContext(
    userId: string
): Promise<UserAccessContext | null> {
    try {
        const supabase = await createClient()

        // Fetch user data
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, role, shop_id, organization_id')
            .eq('id', userId)
            .single()

        if (userError || !userData) {
            console.error('Error fetching user data:', userError)
            return null
        }

        let organizationId = userData.organization_id || null
        let shopData: Shop | null = null
        let accessibleShopIds: string[] = []

        // Fetch shop data if user has a shop_id
        if (userData.shop_id) {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('id, organization_id, shop_name')
                .eq('id', userData.shop_id)
                .single()

            if (!shopError && shop) {
                shopData = shop
                // Inherit organization from shop if user doesn't have explicit org assignment
                if (!organizationId && shop.organization_id) {
                    organizationId = shop.organization_id
                }
            }
        }

        // Determine access scope
        const accessScope = determineAccessScope(
            userData as User,
            shopData
        )

        // Get accessible shop IDs based on scope
        accessibleShopIds = await getAccessibleShopIds(
            supabase,
            accessScope,
            userData.shop_id,
            organizationId
        )

        // Determine permissions based on role
        const permissions = determinePermissions(userData.role || 'user')

        return {
            userId: userData.id,
            shopId: userData.shop_id,
            organizationId,
            accessScope,
            role: userData.role || 'user',
            accessibleShopIds,
            ...permissions
        }
    } catch (error) {
        console.error('Error getting user access context:', error)
        return null
    }
}

/**
 * Gets all shop IDs a user can access based on their scope
 */
async function getAccessibleShopIds(
    supabase: Awaited<ReturnType<typeof createClient>>,
    accessScope: AccessScope,
    shopId: string | null,
    organizationId: string | null
): Promise<string[]> {
    switch (accessScope) {
        case 'platform': {
            // Super admin can access all shops
            const { data: allShops } = await supabase
                .from('shops')
                .select('id')
            return allShops?.map(s => s.id) || []
        }

        case 'organization': {
            // Organization user can access all shops in their org
            if (!organizationId) return shopId ? [shopId] : []
            
            const { data: orgShops } = await supabase
                .from('shops')
                .select('id')
                .eq('organization_id', organizationId)
            return orgShops?.map(s => s.id) || []
        }

        case 'shop':
        default: {
            // Shop user can only access their own shop
            return shopId ? [shopId] : []
        }
    }
}

/**
 * Gets user access context from a request (for API routes)
 */
export async function getUserAccessContextFromRequest(): Promise<UserAccessContext | null> {
    try {
        const supabase = await createClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return null
        }

        return getUserAccessContext(user.id)
    } catch (error) {
        console.error('Error getting user access context from request:', error)
        return null
    }
}

/**
 * Type guard to check if context has organization access
 */
export function hasOrganizationAccess(context: UserAccessContext): boolean {
    return context.accessScope === 'organization' || context.accessScope === 'platform'
}

/**
 * Type guard to check if context has platform access
 */
export function hasPlatformAccess(context: UserAccessContext): boolean {
    return context.accessScope === 'platform'
}

/**
 * Gets shops available for filtering based on user's access scope
 */
export async function getAvailableShopsForUser(
    context: UserAccessContext
): Promise<Shop[]> {
    try {
        const supabase = await createClient()

        if (context.accessScope === 'shop') {
            // Shop user only sees their own shop
            if (!context.shopId) return []
            
            const { data: shop } = await supabase
                .from('shops')
                .select('id, organization_id, shop_name')
                .eq('id', context.shopId)
                .single()
            
            return shop ? [shop] : []
        }

        if (context.accessScope === 'organization' && context.organizationId) {
            // Organization user sees all shops in their org
            const { data: shops } = await supabase
                .from('shops')
                .select('id, organization_id, shop_name')
                .eq('organization_id', context.organizationId)
                .order('shop_name')
            
            return shops || []
        }

        if (context.accessScope === 'platform') {
            // Platform admin sees all shops
            const { data: shops } = await supabase
                .from('shops')
                .select('id, organization_id, shop_name')
                .order('shop_name')
            
            return shops || []
        }

        return []
    } catch (error) {
        console.error('Error getting available shops:', error)
        return []
    }
}
