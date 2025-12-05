'use client'

import { ComponentType, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-provider'
import { Loader2 } from 'lucide-react'

interface WithAuthOptions {
    /**
     * If false, bypasses authentication (for self-hosted or development)
     */
    requireAuth?: boolean
    /**
     * Custom redirect path (defaults to /login)
     */
    redirectTo?: string
    /**
     * Timeout in ms before showing "taking too long" message
     */
    loadingTimeout?: number
}

/**
 * Higher-Order Component for client-side route protection
 * 
 * Based on Supabase Studio's withAuth pattern:
 * - Checks if user is authenticated
 * - Redirects to login if not authenticated
 * - Preserves returnTo parameter for post-login redirect
 * - Shows loading state with timeout
 * 
 * @example
 * ```tsx
 * // Protect a page component
 * export default withAuth(MyPage)
 * 
 * // Protect with custom options
 * export default withAuth(MyPage, { 
 *   redirectTo: '/signin',
 *   loadingTimeout: 15000 
 * })
 * ```
 */
export function withAuth<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: WithAuthOptions = {}
) {
    const {
        requireAuth = true,
        redirectTo = '/login',
        loadingTimeout = 10000,
    } = options

    return function WithAuthComponent(props: P) {
        const { user, session, loading, signOut } = useAuth()
        const router = useRouter()
        const pathname = usePathname()
        const searchParams = useSearchParams()
        const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

        // If auth is not required, render immediately
        if (!requireAuth) {
            return <WrappedComponent {...props} />
        }

        // Check if user is logged in
        const isLoggedIn = Boolean(session && user)

        // Redirect to sign-in if not authenticated
        const redirectToSignIn = useCallback(() => {
            const currentPath = pathname || '/'
            const params = new URLSearchParams(searchParams?.toString() || '')
            params.set('returnTo', currentPath)

            console.log('[withAuth] Redirecting to sign-in, returnTo:', currentPath)

            // Sign out to clear any stale session
            signOut().finally(() => {
                router.push(`${redirectTo}?${params.toString()}`)
            })
        }, [pathname, searchParams, signOut, router])

        // Show timeout warning after specified duration
        useEffect(() => {
            if (loading) {
                const timer = setTimeout(() => {
                    console.warn('[withAuth] Auth loading timeout reached')
                    setShowTimeoutWarning(true)
                }, loadingTimeout)

                return () => clearTimeout(timer)
            }
        }, [loading])

        // Redirect if not authenticated after loading completes
        useEffect(() => {
            if (!loading && !isLoggedIn) {
                redirectToSignIn()
            }
        }, [loading, isLoggedIn, redirectToSignIn])

        // Show loading state
        if (loading) {
            return (
                <div className="h-screen flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">
                            {showTimeoutWarning
                                ? 'This is taking longer than usual...'
                                : 'Loading...'}
                        </p>
                    </div>
                </div>
            )
        }

        // Show nothing while redirecting
        if (!isLoggedIn) {
            return null
        }

        // Render protected component
        return <WrappedComponent {...props} />
    }
}

/**
 * Validate returnTo path to prevent open redirect vulnerabilities
 * Based on Supabase Studio's validateReturnTo function
 */
export function validateReturnTo(returnTo: string, fallback: string = '/'): string {
    // Block protocol-relative URLs (//evil.com)
    if (returnTo.startsWith('//')) {
        console.warn('[withAuth] Blocked protocol-relative URL:', returnTo)
        return fallback
    }

    // Block absolute URLs (https://evil.com)
    if (returnTo.match(/^https?:\/\//)) {
        console.warn('[withAuth] Blocked absolute URL:', returnTo)
        return fallback
    }

    // Block URLs with @ (username@evil.com)
    if (returnTo.includes('@')) {
        console.warn('[withAuth] Blocked URL with @:', returnTo)
        return fallback
    }

    // Must start with /
    if (!returnTo.startsWith('/')) {
        console.warn('[withAuth] Invalid path (must start with /):', returnTo)
        return fallback
    }

    return returnTo
}

/**
 * Get the returnTo path from URL params or use fallback
 */
export function getReturnToPath(fallback: string = '/'): string {
    if (typeof window === 'undefined') return fallback

    const searchParams = new URLSearchParams(window.location.search)
    const returnTo = searchParams.get('returnTo') ?? fallback

    return validateReturnTo(returnTo, fallback)
}

