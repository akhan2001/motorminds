'use client'

import { ComponentType, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useUnifiedAuth } from '@/contexts/unified-auth-context'

/**
 * Higher-Order Component for protecting pages that require authentication.
 * Based on Supabase Studio's withAuth pattern.
 * 
 * Usage:
 * export default withAuth(MyPage)
 * 
 * Flow (matches Studio):
 * 1. Checks if user is authenticated via useUnifiedAuth()
 * 2. If loading: shows nothing (prevents flash)
 * 3. If not authenticated: redirects to /login?returnTo=<current-path>
 * 4. If authenticated: renders the wrapped component
 */
export function withAuth<T extends object>(
  Component: ComponentType<T>,
  options?: {
    requireShopId?: boolean
  }
) {
  const WithAuthHOC: ComponentType<T> = (props) => {
    const router = useRouter()
    const pathname = usePathname()
    const { user, shopInfo, isLoading } = useUnifiedAuth()

    // Default to requiring shopId unless explicitly set to false
    const requireShopId = options?.requireShopId !== false
    const isAuthenticated = Boolean(user)
    const hasRequiredData = requireShopId ? Boolean(shopInfo?.id) : true
    const shouldRedirect = !isLoading && (!isAuthenticated || !hasRequiredData)

    useEffect(() => {
      if (shouldRedirect) {
        // Build redirect URL with returnTo parameter (like Studio)
        const loginUrl = new URL('/login', window.location.origin)
        if (pathname && pathname !== '/login') {
          loginUrl.searchParams.set('returnTo', pathname)
        }
        console.log('[withAuth] Redirecting to login, returnTo:', pathname)
        router.push(loginUrl.pathname + loginUrl.search)
      }
    }, [shouldRedirect, pathname, router])

    // Show nothing while loading or redirecting (prevents flash)
    if (isLoading || shouldRedirect) {
      return null
    }

    // User is authenticated, render the component
    return <Component {...props} />
  }

  WithAuthHOC.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WithAuthHOC
}

