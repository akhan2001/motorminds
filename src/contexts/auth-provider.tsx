'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'

interface ShopInfo {
    id: string
    shop_name: string
    shop_owner: string
    logo_image_url?: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    business_number?: string
}

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    userRole: string | null
    shopId: string | null
    shopInfo: ShopInfo | null
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
    /**
     * If true, bypasses authentication (for self-hosted or development)
     * Similar to Supabase Studio's alwaysLoggedIn prop
     */
    alwaysLoggedIn?: boolean
}

/**
 * AuthProvider - Centralized authentication state management
 * 
 * Based on Supabase Studio's authentication pattern:
 * - Manages user session state
 * - Handles auth state changes
 * - Provides sign-out functionality
 * - Integrates with Next.js router for redirects
 * 
 * @example
 * ```tsx
 * <AuthProvider alwaysLoggedIn={!IS_PLATFORM}>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, alwaysLoggedIn = false }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [shopId, setShopId] = useState<string | null>(null)
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
    const router = useRouter()
    const supabase = createClient()

    // Fetch user profile data (role and shopId)
    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            console.log('[AuthProvider] Fetching user profile for:', userId)
            
            const { data, error } = await supabase
                .from('users')
                .select('role, shop_id')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('[AuthProvider] Error fetching user profile:', error)
                return { role: null, shopId: null }
            }

            console.log('[AuthProvider] User profile fetched:', { role: data?.role, shopId: data?.shop_id })
            return { role: data?.role || null, shopId: data?.shop_id || null }
        } catch (error) {
            console.error('[AuthProvider] Error in fetchUserProfile:', error)
            return { role: null, shopId: null }
        }
    }, [supabase])

    // Fetch shop information
    const fetchShopInfo = useCallback(async (shopId: string) => {
        try {
            console.log('[AuthProvider] Fetching shop info for:', shopId)
            
            const { data, error } = await supabase
                .from('shops')
                .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                .eq('id', shopId)
                .single()

            if (error) {
                console.error('[AuthProvider] Error fetching shop info:', error)
                return null
            }

            console.log('[AuthProvider] Shop info fetched:', data.shop_name)
            return data
        } catch (error) {
            console.error('[AuthProvider] Error in fetchShopInfo:', error)
            return null
        }
    }, [supabase])

    // Initialize auth state
    const initializeAuth = useCallback(async () => {
        try {
            console.log('[AuthProvider] Initializing auth state...')

            if (alwaysLoggedIn) {
                console.log('[AuthProvider] alwaysLoggedIn mode - bypassing auth')
                setLoading(false)
                return
            }

            // Use getSession() on initial load (reads from localStorage, no network call)
            const { data: { session: currentSession }, error } = await supabase.auth.getSession()

            if (error) {
                console.error('[AuthProvider] Error getting session:', error)
                setUser(null)
                setSession(null)
                setUserRole(null)
                setShopId(null)
                setShopInfo(null)
                setLoading(false)
                return
            }

            if (currentSession) {
                console.log('[AuthProvider] Session found:', currentSession.user.email)
                setUser(currentSession.user)
                setSession(currentSession)

                // Fetch user profile data
                const { role, shopId: fetchedShopId } = await fetchUserProfile(currentSession.user.id)
                setUserRole(role)
                setShopId(fetchedShopId)

                // Fetch shop info if shopId exists
                if (fetchedShopId) {
                    const shopData = await fetchShopInfo(fetchedShopId)
                    setShopInfo(shopData)
                }
            } else {
                console.log('[AuthProvider] No active session')
                setUser(null)
                setSession(null)
                setUserRole(null)
                setShopId(null)
                setShopInfo(null)
            }

            setLoading(false)
        } catch (error) {
            console.error('[AuthProvider] Error initializing auth:', error)
            setLoading(false)
        }
    }, [supabase, alwaysLoggedIn, fetchUserProfile, fetchShopInfo])

    // Refresh session manually
    const refreshSession = useCallback(async () => {
        if (alwaysLoggedIn) return

        console.log('[AuthProvider] Refreshing session...')
        setLoading(true)
        await initializeAuth()
    }, [initializeAuth, alwaysLoggedIn])

    // Sign out
    const signOut = useCallback(async () => {
        if (alwaysLoggedIn) return

        try {
            console.log('[AuthProvider] Starting sign out...')

            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('[AuthProvider] Sign out error:', error)
                throw error
            }

            console.log('[AuthProvider] Sign out successful')

            // Clear state (redirect is handled by useSignOut hook)
            setUser(null)
            setSession(null)
            setUserRole(null)
            setShopId(null)
            setShopInfo(null)
        } catch (error) {
            console.error('[AuthProvider] Sign out failed:', error)
            throw error
        }
    }, [supabase, alwaysLoggedIn])

    // Initialize on mount
    useEffect(() => {
        if (alwaysLoggedIn) {
            setLoading(false)
            return
        }

        console.log('[AuthProvider] Setting up auth listener...')

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('[AuthProvider] Auth state changed:', event)

            if (event === 'SIGNED_IN' && newSession) {
                console.log('[AuthProvider] User signed in:', newSession.user.email)
                setUser(newSession.user)
                setSession(newSession)

                // Fetch user profile data
                const { role, shopId: fetchedShopId } = await fetchUserProfile(newSession.user.id)
                setUserRole(role)
                setShopId(fetchedShopId)

                // Fetch shop info if shopId exists
                if (fetchedShopId) {
                    const shopData = await fetchShopInfo(fetchedShopId)
                    setShopInfo(shopData)
                }

                setLoading(false)
            } else if (event === 'SIGNED_OUT') {
                console.log('[AuthProvider] User signed out - clearing all state')
                // Only clear state if we actually had a user before
                // This prevents clearing state during initial load
                setUser(null)
                setSession(null)
                setUserRole(null)
                setShopId(null)
                setShopInfo(null)
                setLoading(false)
            } else if (event === 'TOKEN_REFRESHED' && newSession) {
                console.log('[AuthProvider] Token refreshed')
                setUser(newSession.user)
                setSession(newSession)
                // Don't refetch profile on token refresh - role/shop doesn't change
            } else if (event === 'USER_UPDATED' && newSession) {
                console.log('[AuthProvider] User updated')
                setUser(newSession.user)
                setSession(newSession)
            } else if (event === 'INITIAL_SESSION') {
                console.log('[AuthProvider] Initial session event:', newSession ? 'Has session' : 'No session')
                // INITIAL_SESSION fires on mount - only process if we haven't initialized yet
                if (newSession) {
                    setUser(newSession.user)
                    setSession(newSession)
                    
                    // Fetch user profile data for initial session
                    const { role, shopId: fetchedShopId } = await fetchUserProfile(newSession.user.id)
                    setUserRole(role)
                    setShopId(fetchedShopId)

                    // Fetch shop info if shopId exists
                    if (fetchedShopId) {
                        const shopData = await fetchShopInfo(fetchedShopId)
                        setShopInfo(shopData)
                    }
                } else {
                    // No session on initial load - clear state
                    setUser(null)
                    setSession(null)
                    setUserRole(null)
                    setShopId(null)
                    setShopInfo(null)
                }
                
                // Always set loading to false after INITIAL_SESSION
                setLoading(false)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, alwaysLoggedIn, fetchUserProfile, fetchShopInfo])

    const value: AuthContextType = {
        user,
        session,
        loading,
        userRole,
        shopId,
        shopInfo,
        signOut,
        refreshSession,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

/**
 * Get access token for API requests (client-side only)
 * Returns null if no session exists
 * 
 * NOTE: This is safe to use on the client-side because:
 * - getSession() reads from localStorage (no network call)
 * - The token is validated on the server using getClaims()
 * 
 * For server-side auth, use server-auth.ts utilities instead
 */
export async function getAccessToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

