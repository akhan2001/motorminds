// Consolidated role management and permission checking

import { createClient } from '@/utils/supabase/server'
import { UserRole, UserProfile } from './types'

// Role constants
export const ROLES = {
  ADMIN: 'admin' as const,
  SUPER_ADMIN: 'super-admin' as const,
  SUPER_ADMIN_UNDERSCORE: 'super_admin' as const,
  SHOP_ADMIN: 'shop_admin' as const,
  ORGANIZATION_ADMIN: 'organization_admin' as const,
  DEMO: 'demo' as const,
  USER: 'user' as const,
}

// Admin role variants
export const ADMIN_ROLES: readonly UserRole[] = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.SUPER_ADMIN_UNDERSCORE,
  ROLES.SHOP_ADMIN,
  ROLES.ORGANIZATION_ADMIN,
] as const

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  const normalizedRole = role.toUpperCase()
  return ADMIN_ROLES.some((adminRole) => adminRole.toUpperCase() === normalizedRole)
}

/**
 * Check if a role matches the required role
 */
export function hasRole(userRole?: string | null, requiredRole?: string): boolean {
  if (!userRole || !requiredRole) return false
  return userRole.toLowerCase() === requiredRole.toLowerCase()
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, shop_id, organization_id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as UserProfile
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const profile = await getUserProfile(userId)
  return profile?.role || null
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return isAdminRole(role)
}

/**
 * Check if user has specific role
 */
export async function checkUserRole(userId: string, requiredRole: UserRole): Promise<boolean> {
  const role = await getUserRole(userId)
  return hasRole(role, requiredRole)
}

/**
 * Get user's shop ID
 */
export async function getUserShopId(userId: string): Promise<string | null> {
  const supabase = await createClient()

  // Try user metadata first
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.user_metadata?.shop_id) {
    return user.user_metadata.shop_id
  }

  // Fall back to database
  const profile = await getUserProfile(userId)
  return profile?.shop_id || null
}
