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

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

    const fetchAuthData = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Use getSession first - it doesn't throw on missing session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.warn('Session error:', sessionError)
                // Don't throw - just set user to null
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)
                return
            }

            if (!session?.user) {
                // No session - user is not logged in (this is not an error)
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)
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
        } catch (err) {
            console.error('Authentication error:', err)
            setError(err instanceof Error ? err.message : 'Authentication failed')
            setUser(null)
            setShopId(null)
            setUserRole(null)
            setIsLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        // Initial fetch on mount - single network call
        fetchAuthData()

        // Listen for auth state changes (sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                // Reset redirect flag on sign in
                hasRedirectedRef.current = false
                fetchAuthData()
            } else if (event === 'SIGNED_OUT') {
                fetchAuthData()
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // On token refresh, just update user object without refetching everything
                setUser(session.user)
            }
        })

        return () => subscription.unsubscribe()
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
