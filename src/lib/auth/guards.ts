// Middleware guards for route protection

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminRole } from './roles'
import { getCachedUserShopId, getCachedUserRole, shopIdCache, userRoleCache } from './cache'

export interface GuardContext {
  request: NextRequest
  response: NextResponse
  supabase: ReturnType<typeof createServerClient>
  user: any
}

/**
 * Create authentication guard
 */
export function createAuthGuard(protectedPaths: string[]) {
  return async (ctx: GuardContext): Promise<NextResponse | null> => {
    const isProtectedPath = protectedPaths.some((path) =>
      ctx.request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath && !ctx.user) {
      const redirectUrl = new URL('/login', ctx.request.url)
      redirectUrl.searchParams.set('redirectTo', ctx.request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return null
  }
}

/**
 * Create shop validation guard with caching
 */
export function createShopGuard(protectedPaths: string[]) {
  return async (ctx: GuardContext): Promise<NextResponse | null> => {
    const isProtectedPath = protectedPaths.some((path) =>
      ctx.request.nextUrl.pathname.startsWith(path)
    )

    if (!isProtectedPath || !ctx.user) {
      return null
    }

    let shopId = ctx.user.user_metadata?.shop_id

    if (!shopId) {
      // Try memory cache first
      const cacheKey = `shop:${ctx.user.id}`
      shopId = shopIdCache.get(cacheKey)

      if (!shopId) {
        // Use cached database query (deduplicates requests)
        shopId = await getCachedUserShopId(ctx.user.id, ctx.supabase)

        // Store in memory cache
        if (shopId) {
          shopIdCache.set(cacheKey, shopId)
        }
      }
    }

    if (!shopId) {
      const redirectUrl = new URL('/dashboard', ctx.request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Add shop context to headers
    ctx.response.headers.set('x-user-id', ctx.user.id)
    ctx.response.headers.set('x-shop-id', shopId)

    return null
  }
}

/**
 * Create admin guard with caching
 */
export function createAdminGuard(adminPaths: string[]) {
  return async (ctx: GuardContext): Promise<NextResponse | null> => {
    const isAdminPath = adminPaths.some((path) =>
      ctx.request.nextUrl.pathname.startsWith(path)
    )

    if (!isAdminPath || !ctx.user) {
      return null
    }

    try {
      // Try memory cache first
      const cacheKey = `role:${ctx.user.id}`
      let userData = userRoleCache.get(cacheKey)

      if (!userData) {
        // Use cached database query (deduplicates requests)
        userData = await getCachedUserRole(ctx.user.id, ctx.supabase)

        // Store in memory cache
        if (userData.role) {
          userRoleCache.set(cacheKey, userData)
        }
      }

      if (!userData.role) {
        console.log('No user role found, redirecting to operations/appointments')
        const redirectUrl = new URL('/operations/appointments', ctx.request.url)
        return NextResponse.redirect(redirectUrl)
      }

      if (!isAdminRole(userData.role)) {
        const redirectUrl = new URL('/operations/appointments', ctx.request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking user role for admin access:', error)
      const redirectUrl = new URL('/operations/appointments', ctx.request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return null
  }
}

/**
 * Create demo user redirect guard with caching
 */
export function createDemoRedirectGuard(redirectPaths: string[]) {
  return async (ctx: GuardContext): Promise<NextResponse | null> => {
    const shouldRedirect = redirectPaths.some((path) =>
      ctx.request.nextUrl.pathname === path
    )

    if (!shouldRedirect || !ctx.user) {
      return null
    }

    try {
      // Try memory cache first
      const cacheKey = `role:${ctx.user.id}`
      let userData = userRoleCache.get(cacheKey)

      if (!userData) {
        // Use cached database query (deduplicates requests)
        userData = await getCachedUserRole(ctx.user.id, ctx.supabase)

        // Store in memory cache
        if (userData.role) {
          userRoleCache.set(cacheKey, userData)
        }
      }

      if (userData.role === 'demo') {
        const redirectUrl = new URL('/mia', ctx.request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking user role for demo redirect:', error)
    }

    return null
  }
}
