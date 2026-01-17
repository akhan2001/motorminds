'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/core/user'

interface AuthContextType {
    user: User | null
    shopId: string | null
    userRole: UserRole | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth', '/customer-intake', '/customer-invoice-intake']

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    const router = useRouter()
    const pathname = usePathname()
    
    // Use ref to ensure supabase client is created only once
    const supabaseRef = useRef(createClient())
    const supabase = supabaseRef.current
    
    // Track if we've already redirected to prevent loops
    const hasRedirectedRef = useRef(false)
    // Track if we've completed the initial auth fetch
    const hasInitializedRef = useRef(false)
    // Track if we've received the initial session event
    const hasReceivedInitialSession = useRef(false)

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

    const fetchAuthData = useCallback(async () => {
        try {
            // Only block the UI on the very first auth load
            if (!hasInitializedRef.current) {
                setIsLoading(true)
            }
            setError(null)

            // Use getSession - it reads from cookies synchronously after initialization
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.warn('Session error:', sessionError)
                // Don't throw - just set user to null
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)
                hasInitializedRef.current = true
                return
            }

            if (!session?.user) {
                // No session - user is not logged in (this is not an error)
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)
                hasInitializedRef.current = true
                return
            }

            // Reset redirect flag when user is authenticated
            hasRedirectedRef.current = false
            
            const authUser = session.user
            setUser(authUser)

            // Fetch shop_id and role from users table in a single query
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('shop_id, role')
                .eq('id', authUser.id)
                .maybeSingle()

            if (userError) {
                console.warn('Failed to fetch user data:', userError)
                setShopId(null)
                setUserRole(null)
            } else if (userData) {
                setShopId(userData.shop_id)
                setUserRole(userData.role)
            }

            setIsLoading(false)
            hasInitializedRef.current = true
        } catch (err) {
            console.error('Authentication error:', err)
            setError(err instanceof Error ? err.message : 'Authentication failed')
            setUser(null)
            setShopId(null)
            setUserRole(null)
            setIsLoading(false)
            hasInitializedRef.current = true
        }
    }, [supabase])

    useEffect(() => {
        // Set up auth state change listener FIRST
        // According to GoTrueClient source, INITIAL_SESSION is emitted after:
        // 1. initializePromise completes
        // 2. Session is loaded from storage/cookies
        // This ensures cookies are ready before we try to fetch auth data
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // INITIAL_SESSION fires when the client has initialized and read cookies
            // This is the key event we need to wait for after server-side login redirect
            if (event === 'INITIAL_SESSION') {
                hasReceivedInitialSession.current = true
                // Now that cookies are ready and session is loaded, fetch auth data
                if (session?.user) {
                    await fetchAuthData()
                } else {
                    // No session in cookies
                    setUser(null)
                    setShopId(null)
                    setUserRole(null)
                    setIsLoading(false)
                    hasInitializedRef.current = true
                }
            } else if (event === 'SIGNED_IN') {
                // Reset redirect flag on sign in
                hasRedirectedRef.current = false
                await fetchAuthData()
            } else if (event === 'SIGNED_OUT') {
                // Immediately clear all auth state on sign out
                // Don't call fetchAuthData() as it might still read stale session from cookies
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)
                hasRedirectedRef.current = false
                hasInitializedRef.current = true
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // On token refresh, just update user object without refetching everything
                setUser(session.user)
            }
        })

        // Fallback: If INITIAL_SESSION doesn't fire within 500ms, fetch anyway
        // This handles edge cases where the event might not fire (shouldn't happen, but safety net)
        const fallbackTimeout = setTimeout(() => {
            if (!hasReceivedInitialSession.current && !hasInitializedRef.current) {
                console.warn('INITIAL_SESSION event did not fire within timeout, fetching auth data as fallback')
                fetchAuthData()
            }
        }, 500)

        return () => {
            subscription.unsubscribe()
            clearTimeout(fallbackTimeout)
        }
    }, [fetchAuthData, supabase])

    // Redirect to login if no user and on protected route
    useEffect(() => {
        if (!isLoading && !user && !isPublicRoute && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true
            const redirectTo = pathname || '/'
            router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
        }
    }, [isLoading, user, isPublicRoute, pathname, router])

    // IMPORTANT: Always render children to prevent hooks violation
    // Child components should handle their own loading states based on isLoading
    return (
        <AuthContext.Provider
            value={{
                user,
                shopId,
                userRole,
                isLoading,
                error,
                refetch: fetchAuthData
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
