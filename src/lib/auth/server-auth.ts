import { createClient } from "@/utils/supabase/server";

/**
 * Server-side authentication utilities using getClaims()
 * 
 * IMPORTANT: Always use getClaims() on the server to validate JWT signatures
 * - getClaims() validates the JWT signature against published public keys
 * - getUser() makes a network call (slower, can fail)
 * - getSession() can be spoofed (reads from cookies without validation)
 * 
 * Based on Supabase best practices for SSR authentication
 */

interface UserClaims {
    sub: string // User ID
    email?: string
    role?: string
    user_metadata?: Record<string, any>
    app_metadata?: Record<string, any>
}

/**
 * Get authenticated user claims from JWT
 * Returns null if not authenticated or JWT is invalid
 */
export async function getAuthenticatedUser(): Promise<UserClaims | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.getClaims();
    
    if (error || !data?.claims) {
        console.error('[ServerAuth] getClaims error:', error);
        return null;
    }

    return data.claims as UserClaims;
}

/**
 * Get user ID from JWT claims
 */
export async function getUserId(): Promise<string | null> {
    const claims = await getAuthenticatedUser();
    return claims?.sub || null;
}

/**
 * Get user email from JWT claims
 */
export async function getUserEmail(): Promise<string | null> {
    const claims = await getAuthenticatedUser();
    return claims?.email || null;
}

/**
 * Get user profile (role, shop_id) from database
 */
export async function getUserProfile() {
    const userId = await getUserId();
    
    if (!userId) {
        return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('users')
        .select('role, shop_id, organization_id')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('[ServerAuth] Error fetching user profile:', error);
        return null;
    }

    return data;
}

/**
 * Get shop ID for authenticated user
 */
export async function getShopId(): Promise<string | null> {
    const profile = await getUserProfile();
    return profile?.shop_id || null;
}

/**
 * Get user role for authenticated user
 */
export async function getUserRole(): Promise<string | null> {
    const profile = await getUserProfile();
    return profile?.role || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const userId = await getUserId();
    return userId !== null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<UserClaims> {
    const claims = await getAuthenticatedUser();
    
    if (!claims) {
        throw new Error('Authentication required');
    }

    return claims;
}

/**
 * Check if user has specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
    const role = await getUserRole();
    return role?.toUpperCase() === requiredRole.toUpperCase();
}

/**
 * Check if user is admin (any admin role)
 */
export async function isAdmin(): Promise<boolean> {
    const role = await getUserRole();
    const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'SUPER-ADMIN', 'SHOP_ADMIN', 'ORGANIZATION_ADMIN'];
    return role ? adminRoles.includes(role.toUpperCase()) : false;
}

