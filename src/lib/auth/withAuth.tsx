'use client'

import { useEffect, ComponentType } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

/**
 * Higher-Order Component that protects pages requiring authentication
 * Follows Supabase Studio's withAuth pattern
 * 
 * Usage:
 * export default withAuth(MyProtectedPage)
 */
export function withAuth<T extends object>(
    Component: ComponentType<T>,
    options?: {
        redirectTo?: string
    }
) {
    const WithAuthHOC: ComponentType<T> = (props) => {
        const router = useRouter()
        const pathname = usePathname()
        const { session, user, shopId, isLoading } = useAuth()

        const isLoggedIn = Boolean(session && user)
        const isFinishedLoading = !isLoading

        // Determine if we should redirect to login
        const shouldRedirect = isFinishedLoading && !isLoggedIn

        useEffect(() => {
            if (shouldRedirect) {
                const redirectTo = options?.redirectTo || '/login'
                const returnTo = pathname !== redirectTo ? pathname : undefined
                const redirectUrl = returnTo 
                    ? `${redirectTo}?returnTo=${encodeURIComponent(returnTo)}`
                    : redirectTo
                
                console.log('WITH_AUTH - Redirecting to login:', { redirectUrl, returnTo })
                router.push(redirectUrl)
            }
        }, [shouldRedirect, router, pathname])

        // Show nothing while loading or redirecting
        if (isLoading || shouldRedirect) {
            return null
        }

        // Render the protected component
        return <Component {...props} />
    }

    WithAuthHOC.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`

    return WithAuthHOC
}

