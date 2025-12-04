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
}

const UnifiedAuthContext = createContext<UnifiedAuthState | undefined>(undefined)

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UnifiedAuthState>({
        user: null,
        role: null,
        shopInfo: null,
        isLoading: true,
    })

    useEffect(() => {
        const supabase = createClient()
        let mounted = true

        // Fetch user data once
        async function fetchUserData(userId: string) {
            const { data: userData } = await supabase
                .from('users')
                .select('role, shop_id')
                .eq('id', userId)
                .maybeSingle()

            if (!mounted || !userData) return null

            const role = userData.role
            const shopId = userData.shop_id

            // Fetch shop if we have shopId
            let shopInfo = null
            if (shopId) {
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', shopId)
                    .maybeSingle()

                if (shopData) shopInfo = shopData
            }

            return { role, shopInfo }
        }

        // Initialize - check if user is logged in
        async function initialize() {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!session?.user) {
                    setState({ user: null, role: null, shopInfo: null, isLoading: false })
                    return
                }

                const userData = await fetchUserData(session.user.id)

                if (mounted) {
                    setState({
                        user: session.user,
                        role: userData?.role || null,
                        shopInfo: userData?.shopInfo || null,
                        isLoading: false,
                    })
                }
            } catch (error) {
                console.error('[UnifiedAuth] Error during initialization:', error)
                setState({ user: null, role: null, shopInfo: null, isLoading: false })
            }
        }

        initialize()

        // Listen for auth changes - NO async in callback
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // FAST synchronous updates only
            if (event === 'SIGNED_OUT') {
                setState({ user: null, role: null, shopInfo: null, isLoading: false })
            } else if (event === 'SIGNED_IN' && session?.user) {
                // Set user immediately, fetch data outside callback
                setState(prev => ({ ...prev, user: session.user, isLoading: false }))
            }

            // Async operations OUTSIDE callback
            setTimeout(async () => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const userData = await fetchUserData(session.user.id)
                    if (mounted) {
                        setState({
                            user: session.user,
                            role: userData?.role || null,
                            shopInfo: userData?.shopInfo || null,
                            isLoading: false,
                        })
                    }
                }
            }, 0)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <UnifiedAuthContext.Provider value={state}>
            {children}
        </UnifiedAuthContext.Provider>
    )
}

export function useUnifiedAuth() {
    const context = useContext(UnifiedAuthContext)
    if (context === undefined) {
        throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider')
    }
    return context
}

// Backward compatibility
export function useUserRole() {
    const { role, isLoading } = useUnifiedAuth()
    return { data: role, isLoading, error: null }
}

export function useShopInfo() {
    const { shopInfo, isLoading } = useUnifiedAuth()
    return { data: shopInfo, isLoading, error: null }
}