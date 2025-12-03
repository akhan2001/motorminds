// Middleware guards for route protection

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminRole } from './roles'

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
 * Create shop validation guard
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
      try {
        const { data: userData, error } = await ctx.supabase
          .from('users')
          .select('shop_id')
          .eq('id', ctx.user.id)
          .single()

        if (!error && userData?.shop_id) {
          shopId = userData.shop_id
        }
      } catch (error) {
        console.error('Error fetching user shop_id:', error)
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
 * Create admin guard
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
      const { data: userData, error } = await ctx.supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', ctx.user.id)
        .single()

      if (error || !userData) {
        console.log('Error or no userData, redirecting to operations/appointments')
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
 * Create demo user redirect guard
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
      const { data: userData, error } = await ctx.supabase
        .from('users')
        .select('role')
        .eq('id', ctx.user.id)
        .single()

      if (!error && userData?.role === 'demo') {
        const redirectUrl = new URL('/mia', ctx.request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking user role for demo redirect:', error)
    }

    return null
  }
}
