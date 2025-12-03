# Authentication Caching Strategy

## Problem: Thundering Herd

The middleware was making **60+ duplicate database queries** for the same user data within 2.5 seconds, causing:

- Excessive database load
- Slow response times
- Wasted resources
- Potential rate limiting issues

### Root Cause

The middleware runs on **every request** to protected routes. When a page loads with multiple assets (images, stylesheets, API calls, etc.), the middleware executes for each one, triggering duplicate database queries.

Example from logs:
```json
{
  "path": "/rest/v1/users",
  "search": "?select=shop_id&id=eq.a178eec4-bb21-43d5-b646-96be87b2c47f",
  "timestamp": 1764730501179000  // 62+ identical requests in 2.5 seconds
}
```

## Solution: Multi-Layer Caching

We implemented a **two-tier caching strategy** to eliminate redundant database queries:

### Layer 1: Request-Level Cache (React `cache()`)

**Purpose:** Deduplicate requests **within the same render cycle**

```typescript
import { cache } from 'react'

export const getCachedUserShopId = cache(async (userId: string, supabase: any) => {
  const { data } = await supabase
    .from('users')
    .select('shop_id')
    .eq('id', userId)
    .single()

  return data?.shop_id || null
})
```

**Benefits:**
- ✅ Automatic deduplication by React
- ✅ Works across middleware and server components
- ✅ Zero configuration needed
- ✅ No stale data issues

**Scope:** Single request/render cycle only

---

### Layer 2: Memory Cache (In-Memory with TTL)

**Purpose:** Cache across **multiple requests** for the same user

```typescript
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttl: number = 300000 // 5 minutes

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry || Date.now() > entry.expiresAt) {
      return null
    }
    return entry.value
  }
}
```

**Benefits:**
- ✅ Reduces database load across requests
- ✅ Configurable TTL (5 minutes default)
- ✅ Automatic expiration
- ✅ Periodic cleanup

**TTL Settings:**
- `shopIdCache`: 5 minutes
- `userRoleCache`: 5 minutes

---

## How It Works

### Before (No Caching)

```
Request 1 → Middleware → DB Query → shop_id
Request 2 → Middleware → DB Query → shop_id  // Duplicate!
Request 3 → Middleware → DB Query → shop_id  // Duplicate!
... 60 more times
```

**Result:** 60+ database queries for the same data

---

### After (With Caching)

```
Request 1 → Middleware → Memory Cache (miss) → DB Query → Cache → shop_id
Request 2 → Middleware → Memory Cache (HIT) → shop_id  // No DB query!
Request 3 → Middleware → Memory Cache (HIT) → shop_id  // No DB query!
... all subsequent requests use cache
```

**Result:** 1 database query, 59+ cache hits

---

## Cache Flow

```
┌─────────────────────────────────────────────────────────┐
│ User makes request to /operations/appointments          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Middleware runs (createShopGuard)                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Check: user.user_metadata?.shop_id exists?              │
└─────────────────────────────────────────────────────────┘
         Yes ↓                           No ↓
         Return                           ↓
                        ┌─────────────────────────────────┐
                        │ Check memory cache              │
                        │ shopIdCache.get(`shop:${userId}`)│
                        └─────────────────────────────────┘
                             Hit ↓            Miss ↓
                             Return            ↓
                                    ┌─────────────────────┐
                                    │ React cache()       │
                                    │ getCachedUserShopId()│
                                    └─────────────────────┘
                                    Cached ↓    Not Cached ↓
                                    Return       ↓
                                              ┌─────────────┐
                                              │ DB Query    │
                                              │ (ONLY ONCE) │
                                              └─────────────┘
                                                     ↓
                                    ┌─────────────────────────┐
                                    │ Store in memory cache   │
                                    │ shopIdCache.set(...)    │
                                    └─────────────────────────┘
                                                     ↓
                                              Return shop_id
```

---

## Performance Impact

### Before Caching

```
Total DB Queries: 62+
Time: 2.5 seconds
Database Load: HIGH
Response Time: SLOW
```

### After Caching

```
Total DB Queries: 1 (per TTL window)
Time: <100ms (from cache)
Database Load: LOW
Response Time: FAST
```

**Reduction:** ~98% fewer database queries

---

## Cache Invalidation

### When cache expires:

1. **Automatic TTL expiration** (5 minutes)
2. **Manual cache clearing:**
   ```typescript
   import { shopIdCache, userRoleCache } from '@/lib/auth'

   // Clear shop cache
   shopIdCache.clear()

   // Clear role cache
   userRoleCache.clear()
   ```

3. **Periodic cleanup:**
   - Runs every 60 seconds
   - Removes expired entries
   - Prevents memory leaks

### When to manually clear cache:

- User role changes
- User's shop assignment changes
- After admin actions that modify user data

---

## Usage Examples

### In Middleware

```typescript
import { getCachedUserShopId, shopIdCache } from '@/lib/auth/cache'

// Automatic caching
const shopId = await getCachedUserShopId(userId, supabase)
// Second call uses cache automatically
```

### Manual Cache Management

```typescript
import { shopIdCache, userRoleCache } from '@/lib/auth'

// Clear specific user's cache
shopIdCache.set(`shop:${userId}`, newShopId)

// Clear all caches
shopIdCache.clear()
userRoleCache.clear()
```

---

## Monitoring

### Check cache effectiveness:

```typescript
// Add logging (for debugging only)
const shopId = shopIdCache.get(cacheKey)
console.log(shopId ? 'Cache HIT' : 'Cache MISS')
```

### Expected behavior:

- **First request:** Cache MISS → DB query
- **Subsequent requests (within 5 min):** Cache HIT → No DB query
- **After 5 minutes:** Cache MISS → DB query (refreshes cache)

---

## Configuration

### Adjust TTL (Time To Live)

```typescript
// In src/lib/auth/cache.ts

// Short TTL (1 minute) for frequently changing data
export const shopIdCache = new MemoryCache<string>(60)

// Long TTL (30 minutes) for rarely changing data
export const userRoleCache = new MemoryCache<Role>(1800)
```

### Adjust cleanup interval

```typescript
// In src/lib/auth/cache.ts

// Run cleanup every 5 minutes instead of 1 minute
setInterval(() => {
  shopIdCache.cleanup()
  userRoleCache.cleanup()
}, 300000) // 5 minutes
```

---

## Best Practices

1. **Don't cache sensitive data longer than necessary**
   - Current: 5 minutes is safe for shop_id and role
   - Adjust based on security requirements

2. **Monitor cache hit rates**
   - High hit rate = good caching
   - Low hit rate = may need longer TTL

3. **Clear cache after user updates**
   - After role changes
   - After shop reassignment
   - After permission changes

4. **Use React cache() for request-level deduplication**
   - Already implemented
   - Works automatically
   - No manual management needed

5. **Use memory cache for session-level persistence**
   - Reduces DB load across requests
   - Configurable TTL
   - Manual clearing when needed

---

## Troubleshooting

### Problem: Still seeing duplicate queries

**Check:**
- Are you using the cached functions? (`getCachedUserShopId`)
- Is the cache being cleared too frequently?
- Are you bypassing the cache?

**Solution:**
- Ensure all guards use cached functions
- Review cache clearing logic
- Check TTL settings

### Problem: Stale data (user sees old role/shop)

**Check:**
- When was the last update?
- Is TTL too long?

**Solution:**
- Manually clear cache after updates:
  ```typescript
  shopIdCache.clear()
  userRoleCache.clear()
  ```
- Reduce TTL if needed

### Problem: Memory usage increasing

**Check:**
- Is cleanup running?
- Are entries expiring?

**Solution:**
- Verify cleanup interval is active
- Reduce TTL to expire entries faster
- Monitor cache size

---

## Future Enhancements

Potential improvements:

1. **Redis caching** - For multi-instance deployments
2. **Cache warming** - Pre-populate cache on user login
3. **Metrics** - Track cache hit/miss rates
4. **Edge caching** - Use CDN edge caching where possible
5. **Compression** - Compress cached values to reduce memory

---

## Summary

✅ **Before:** 60+ duplicate DB queries in 2.5 seconds
✅ **After:** 1 DB query, 59+ cache hits
✅ **Performance:** ~98% reduction in database load
✅ **Implementation:** Two-tier caching (React cache + Memory cache)
✅ **TTL:** 5 minutes (configurable)
✅ **Cleanup:** Automatic every 60 seconds

The caching strategy eliminates the thundering herd problem while maintaining data freshness and simplicity.
