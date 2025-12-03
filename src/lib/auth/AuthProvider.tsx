'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface ShopInfo {
    id: string
    shop_name: string
    shop_owner: string
    logo_image_url: string | null
    shop_email: string | null
    shop_phone: string | null
    shop_address: string | null
    shop_city: string | null
    shop_province: string | null
    business_number: string | null
}

interface AuthContextType {
    user: User | null
    userRole: string | null
    shopId: string | null
    shopInfo: ShopInfo | null
    isLoading: boolean
    error: string | null
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Omit<AuthContextType, 'signOut'>>({
        user: null,
        userRole: null,
        shopId: null,
        shopInfo: null,
        isLoading: true,
        error: null
    })

    const signOut = async () => {
        try {
            console.log('AUTH PROVIDER - Signing out...')
            const { error } = await supabase.auth.signOut()
            
            if (error) {
                console.error('AUTH PROVIDER - Sign out error:', error)
                throw error
            }
            
            // Clear auth state
            setState({
                user: null,
                userRole: null,
                shopId: null,
                shopInfo: null,
                isLoading: false,
                error: null
            })
            
            console.log('AUTH PROVIDER - User signed out successfully')
        } catch (error) {
            console.error('AUTH PROVIDER - Sign out failed:', error)
            throw error
        }
    }

    useEffect(() => {
        let mounted = true

        const loadUserData = async (user: User) => {
            try {
                // Fetch user role and shop_id
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role, shop_id')
                    .eq('id', user.id)
                    .single()

                if (!mounted) return

                if (userError) {
                    console.error('Error fetching user data:', userError)
                    setState({
                        user,
                        userRole: null,
                        shopId: null,
                        shopInfo: null,
                        isLoading: false,
                        error: userError.message
                    })
                    return
                }

                const shopId = userData?.shop_id
                const userRole = userData?.role

                // Fetch shop info if we have a shop_id
                if (shopId) {
                    const { data: shopData, error: shopError } = await supabase
                        .from('shops')
                        .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                        .eq('id', shopId)
                        .single()

                    if (!mounted) return

                    if (shopError) {
                        console.error('Error fetching shop info:', shopError)
                    }

                    setState({
                        user,
                        userRole,
                        shopId,
                        shopInfo: shopData || null,
                        isLoading: false,
                        error: null
                    })
                } else {
                    // No shop_id, just set user and role
                    if (mounted) {
                        setState({
                            user,
                            userRole,
                            shopId: null,
                            shopInfo: null,
                            isLoading: false,
                            error: null
                        })
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error)
                if (mounted) {
                    setState({
                        user,
                        userRole: null,
                        shopId: null,
                        shopInfo: null,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to load user data'
                    })
                }
            }
        }

        const loadAuth = async () => {
            try {
                // Get session once
                const { data: { session } } = await supabase.auth.getSession()

                if (!mounted) return

                if (session?.user) {
                    await loadUserData(session.user)
                } else if (mounted) {
                    setState({ user: null, userRole: null, shopId: null, shopInfo: null, isLoading: false, error: null })
                }
            } catch (error) {
                console.error('Error getting session:', error)
                if (mounted) {
                    setState({
                        user: null,
                        userRole: null,
                        shopId: null,
                        shopInfo: null,
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Auth failed'
                    })
                }
            }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log('AUTH PROVIDER - Event:', event, 'Has session:', !!session)

                // Handle all events that provide a session
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                    // Set loading state immediately before async operation
                    setState(prev => ({ ...prev, isLoading: true }))
                    await loadUserData(session.user)
                } else if (event === 'SIGNED_OUT') {
                    setState({ user: null, userRole: null, shopId: null, shopInfo: null, isLoading: false, error: null })
                }
            }
        )

        loadAuth()

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ ...state, signOut }}>
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