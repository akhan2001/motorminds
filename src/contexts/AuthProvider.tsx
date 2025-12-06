'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
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
