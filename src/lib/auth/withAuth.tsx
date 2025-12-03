'use client'

import { ComponentType, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

/**
 * Higher-Order Component for protecting pages that require authentication.
 * 
 * Usage:
 * export default withAuth(MyPage)
 * 
 * Flow:
 * 1. Checks if user is authenticated via useAuth()
 * 2. If loading: shows nothing (prevents flash)
 * 3. If not authenticated: redirects to /login with returnTo param
 * 4. If authenticated: renders the wrapped component
 * 
 * Based on Supabase Studio's withAuth pattern:
 * - Consistent auth checks across all protected pages
 * - Automatic redirect with return path
 * - Loading state handling
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
        const { user, shopId, isLoading } = useAuth()

        // Default to requiring shopId unless explicitly set to false
        const requireShopId = options?.requireShopId !== false
        const isAuthenticated = Boolean(user)
        const hasRequiredData = requireShopId ? Boolean(shopId) : true
        const shouldRedirect = !isLoading && (!isAuthenticated || !hasRequiredData)

        useEffect(() => {
            if (shouldRedirect) {
                const returnTo = encodeURIComponent(pathname || '/')
                console.log('WITH_AUTH - Redirecting to login, returnTo:', pathname)
                router.push(`/login?returnTo=${returnTo}`)
            }
        }, [shouldRedirect, pathname, router])

        // Show nothing while loading or redirecting
        if (isLoading || shouldRedirect) {
            return null
        }

        // User is authenticated, render the component
        return <Component {...props} />
    }

    WithAuthHOC.displayName = `withAuth(${Component.displayName || Component.name})`

    return WithAuthHOC
}
