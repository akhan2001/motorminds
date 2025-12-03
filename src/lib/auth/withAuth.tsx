'use client'

import { ComponentType, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUnifiedAuth } from '@/contexts/unified-auth-context'

/**
 * Higher-Order Component for protecting pages that require authentication.
 * Based on Supabase Studio's withAuth pattern.
 * 
 * Studio's approach:
 * 1. Check isLoading - if true, wait (don't redirect)
 * 2. Only when isFinishedLoading === true, check authentication
 * 3. If not authenticated, redirect to /login
 * 
 * This prevents "Authentication Required" flash after login because:
 * - Login redirects immediately
 * - Destination page waits for auth to load via this HOC
 * - Only redirects if auth finishes loading AND user not logged in
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

		// Studio pattern: check isFinishedLoading first
		const isFinishedLoading = !isLoading
		const isLoggedIn = Boolean(user)

		// Default to requiring shopId unless explicitly set to false
		const requireShopId = options?.requireShopId !== false
		const hasRequiredData = requireShopId ? Boolean(shopInfo?.id) : true

		// KEY: Only redirect if loading is finished AND (not logged in OR missing required data)
		const shouldRedirect = isFinishedLoading && (!isLoggedIn || !hasRequiredData)

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
		if (!isFinishedLoading || shouldRedirect) {
			return null
		}

		// User is authenticated and loading finished, render the component
		return <Component {...props} />
	}

	WithAuthHOC.displayName = `withAuth(${Component.displayName || Component.name})`

	return WithAuthHOC
}

