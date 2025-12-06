'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
const PUBLIC_ROUTES = ['/login', '/signup', '/auth', '/customer-intake']

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const fetchAuthData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Single network call to get user
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError) throw authError

            if (!authUser) {
                setUser(null)
                setShopId(null)
                setUserRole(null)
                setIsLoading(false)

                // Redirect to login if not on a public route
                const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))
                if (!isPublicRoute && pathname) {
                    router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`)
                }
                return
            }

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

            // Redirect to login on error if not on public route
            const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))
            if (!isPublicRoute && pathname) {
                router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`)
            }
        }
    }

    useEffect(() => {
        // Initial fetch on mount - single network call
        fetchAuthData()

        // Listen for auth state changes (sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Only refetch on actual sign in/out, not token refresh
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                fetchAuthData()
            } else if (event === 'TOKEN_REFRESHED' && session) {
                // On token refresh, just update user object without refetching everything
                setUser(session.user)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Show loading state on initial load for protected routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))
    if (isLoading && !isPublicRoute) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

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
