// Request-level caching for authentication data
// Prevents duplicate database queries during a single request cycle

import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'

/**
 * Cache wrapper for user shop_id lookups
 * Uses React cache() to deduplicate requests within the same render cycle
 */
export const getCachedUserShopId = cache(async (userId: string, supabase: any): Promise<string | null> => {
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
})

/**
 * Cache wrapper for user role lookups
 * Uses React cache() to deduplicate requests within the same render cycle
 */
export const getCachedUserRole = cache(async (userId: string, supabase: any): Promise<{ role: string | null, organization_id?: string | null }> => {
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
})

/**
 * In-memory cache with TTL for session-level caching
 * This provides additional caching beyond React's request-level cache
 */
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
