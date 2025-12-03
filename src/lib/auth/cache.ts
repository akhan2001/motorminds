// Request-level caching for authentication data
// Edge Runtime compatible (no React cache dependency)

import { createServerClient } from '@supabase/ssr'

// In-memory cache with TTL for middleware (Edge Runtime compatible)
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttl: number

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  clear(): void {
    this.cache.clear()
  }

  // Periodic cleanup of expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Shop ID cache with 5-minute TTL
export const shopIdCache = new MemoryCache<string>(300)

// User role cache with 5-minute TTL
export const userRoleCache = new MemoryCache<{ role: string, organization_id?: string }>(300)

// Cleanup expired cache entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    shopIdCache.cleanup()
    userRoleCache.cleanup()
  }, 60000)
}

/**
 * Get user shop_id (Edge Runtime compatible)
 * Uses only memory cache, no React cache
 */
export async function getCachedUserShopId(userId: string, supabase: any): Promise<string | null> {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('shop_id')
      .eq('id', userId)
      .single()

    if (error || !userData?.shop_id) {
      return null
    }

    return userData.shop_id
  } catch (error) {
    console.error('Error fetching user shop_id:', error)
    return null
  }
}

/**
 * Get user role (Edge Runtime compatible)
 * Uses only memory cache, no React cache
 */
export async function getCachedUserRole(userId: string, supabase: any): Promise<{ role: string | null, organization_id?: string | null }> {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      return { role: null, organization_id: null }
    }

    return {
      role: userData.role,
      organization_id: userData.organization_id
    }
  } catch (error) {
    console.error('Error fetching user role:', error)
    return { role: null, organization_id: null }
  }
}
