'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/types/core/user'

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

interface UnifiedAuthState {
    user: User | null
    role: UserRole | null
    shopInfo: ShopInfo | null
    isLoading: boolean
    error: string | null
}

interface UnifiedAuthContextType extends UnifiedAuthState {
    refetch: () => Promise<void>
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UnifiedAuthState>({
        user: null,
        role: null,
        shopInfo: null,
        isLoading: true,
        error: null
    })


    // Set up auth state listener ONCE on mount
    useEffect(() => {
        const supabase = createClient()
        let isMounted = true

        // Single function to fetch all auth data
        const fetchAuthData = async () => {
            try {
                console.log('[UnifiedAuth] Starting fetchAuthData...')
                // Get user from Supabase
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                console.log('[UnifiedAuth] getUser result:', { user: !!user, error: userError })

                if (!isMounted) {
                    console.log('[UnifiedAuth] Component unmounted, aborting')
                    return
                }

                if (userError) {
                    console.warn('[UnifiedAuth] Error fetching user:', userError)
                    setState({
                        user: null,
                        role: null,
                        shopInfo: null,
                        isLoading: false,
                        error: userError.message
                    })
                    return
                }

                if (!user) {
                    console.log('[UnifiedAuth] No user found, setting state to logged out')
                    setState({
                        user: null,
                        role: null,
                        shopInfo: null,
                        isLoading: false,
                        error: null
                    })
                    return
                }

                console.log('[UnifiedAuth] User found, fetching user data from database...')
                // Fetch user data including role and shop_id in a SINGLE query
                const { data: userData, error: userDataError } = await supabase
                    .from('users')
                    .select('role, shop_id')
                    .eq('id', user.id)
                    .maybeSingle()

                console.log('[UnifiedAuth] User data result:', { userData, error: userDataError })

                if (!isMounted) {
                    console.log('[UnifiedAuth] Component unmounted, aborting')
                    return
                }

                if (userDataError && userDataError.code !== 'PGRST116') {
                    console.warn('[UnifiedAuth] Error fetching user data:', userDataError)
                }

                const role = userData?.role || null
                const shopId = userData?.shop_id || null
                console.log('[UnifiedAuth] Extracted role and shopId:', { role, shopId })

                // Fetch shop info if shop_id exists
                let shopInfo: ShopInfo | null = null
                if (shopId) {
                    console.log('[UnifiedAuth] Fetching shop data for shopId:', shopId)
                    const { data: shopData, error: shopError } = await supabase
                        .from('shops')
                        .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                        .eq('id', shopId)
                        .maybeSingle()

                    console.log('[UnifiedAuth] Shop data result:', { shopData, error: shopError })

                    if (!isMounted) {
                        console.log('[UnifiedAuth] Component unmounted, aborting')
                        return
                    }

                    if (shopError && shopError.code !== 'PGRST116') {
                        console.warn('[UnifiedAuth] Error fetching shop data:', shopError)
                    } else if (shopData) {
                        shopInfo = shopData
                    }
                }

                if (isMounted) {
                    console.log('[UnifiedAuth] Setting final state:', {
                        hasUser: !!user,
                        role,
                        hasShopInfo: !!shopInfo,
                        shopId: shopInfo?.id
                    })
                    setState({
                        user,
                        role,
                        shopInfo,
                        isLoading: false,
                        error: null
                    })
                }

            } catch (error) {
                console.error('[UnifiedAuth] Unexpected error fetching auth data:', error)
                if (isMounted) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }))
                }
            }
        }

        // Initial fetch
        console.log('[UnifiedAuth] Component mounted, starting initial fetch')
        fetchAuthData()

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[UnifiedAuth] Auth state changed:', event)
            // Only refetch on actual sign out, not SIGNED_IN or token refresh
            // SIGNED_IN fires on initial load after we already fetched, causing double fetch
            if (event === 'SIGNED_OUT') {
                console.log('[UnifiedAuth] Refetching auth data due to:', event)
                await fetchAuthData()
            } else if (event === 'SIGNED_IN') {
                console.log('[UnifiedAuth] Ignoring SIGNED_IN event (already have data)')
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, []) // Only run once on mount

    // Manual refetch function
    const refetch = async () => {
        setState(prev => ({ ...prev, isLoading: true }))

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setState({
                    user: null,
                    role: null,
                    shopInfo: null,
                    isLoading: false,
                    error: null
                })
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('role, shop_id')
                .eq('id', user.id)
                .maybeSingle()

            const role = userData?.role || null
            const shopId = userData?.shop_id || null

            let shopInfo: ShopInfo | null = null
            if (shopId) {
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                    .eq('id', shopId)
                    .maybeSingle()

                if (shopData) {
                    shopInfo = shopData
                }
            }

            setState({
                user,
                role,
                shopInfo,
                isLoading: false,
                error: null
            })
        } catch (error) {
            console.error('Error refetching auth data:', error)
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }))
        }
    }

    return (
        <UnifiedAuthContext.Provider value={{
            ...state,
            refetch
        }}>
            {children}
        </UnifiedAuthContext.Provider>
    )
}

// Hook to use the unified auth context
export function useUnifiedAuth() {
    const context = useContext(UnifiedAuthContext)
    if (context === undefined) {
        throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider')
    }
    return context
}

// Backward compatibility hooks for existing code
export function useUserRole() {
    const { role, isLoading } = useUnifiedAuth()
    return {
        data: role,
        isLoading,
        error: null
    }
}

export function useShopInfo() {
    const { shopInfo, isLoading } = useUnifiedAuth()
    return {
        data: shopInfo,
        isLoading,
        error: null
    }
}
