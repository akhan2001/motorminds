/**
 * API Authentication Utilities
 * 
 * Helper functions for authenticating API routes using getClaims()
 * instead of getUser() for robust JWT validation.
 */

import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Get authenticated user ID from JWT claims
 * Returns userId or null if not authenticated
 */
export async function getAuthenticatedUserId() {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    
    if (!data?.claims?.sub) {
        return null
    }
    
    return data.claims.sub
}

/**
 * Get authenticated user ID or return 401 Unauthorized response
 * Use this in API routes to enforce authentication
 */
export async function requireAuth() {
    const userId = await getAuthenticatedUserId()
    
    if (!userId) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
            userId: null
        }
    }
    
    return { error: null, userId }
}

/**
 * Get shop ID for authenticated user
 * Returns shopId or null if not found
 */
export async function getAuthenticatedUserShopId(userId: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('users')
        .select('shop_id')
        .eq('id', userId)
        .single()
    
    if (error || !data?.shop_id) {
        return null
    }
    
    return data.shop_id
}

/**
 * Verify user has access to a specific shop
 * Returns true if user has access, false otherwise
 */
export async function verifyShopAccess(userId: string, shopId: string): Promise<boolean> {
    const userShopId = await getAuthenticatedUserShopId(userId)
    return userShopId === shopId
}

