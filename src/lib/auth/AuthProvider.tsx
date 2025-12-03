'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
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
    session: Session | null
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
        session: null,
        user: null,
        userRole: null,
        shopId: null,
        shopInfo: null,
        isLoading: true,
        error: null
    })

    const signOut = useCallback(async () => {
        try {
            console.log('AUTH PROVIDER - Signing out...')
            
            // 1. Sign out from Supabase (clears cookies)
            const { error } = await supabase.auth.signOut()
            
            if (error) {
                console.error('AUTH PROVIDER - Sign out error:', error)
                throw error
            }
            
            // 2. Clear localStorage
            if (typeof window !== 'undefined') {
                localStorage.clear()
            }
            
            // 3. Clear auth state
            setState({
                session: null,
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
    }, [])

    useEffect(() => {
        let mounted = true

        const loadUserData = async (session: Session) => {
            try {
                const user = session.user

                // Fetch user role and shop_id in parallel
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role, shop_id')
                    .eq('id', user.id)
                    .single()

                if (!mounted) return

                if (userError) {
                    console.error('AUTH PROVIDER - Error fetching user data:', userError)
                    setState({
                        session,
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
                        console.error('AUTH PROVIDER - Error fetching shop info:', shopError)
                    }

                    setState({
                        session,
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
                            session,
                            user,
                            userRole,
                            shopId: null,
                            shopInfo: null,
                            isLoading: false,
                            error: null
                        })
                    }
                }

                console.log('AUTH PROVIDER - User data loaded:', { 
                    userId: user.id, 
                    userRole, 
                    shopId 
                })
            } catch (error) {
                console.error('AUTH PROVIDER - Error loading user data:', error)
                if (mounted) {
                    setState({
                        session,
                        user: session.user,
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
                // Get initial session
                const { data: { session } } = await supabase.auth.getSession()

                if (!mounted) return

                if (session) {
                    console.log('AUTH PROVIDER - Initial session found')
                    await loadUserData(session)
                } else {
                    console.log('AUTH PROVIDER - No initial session')
                    if (mounted) {
                        setState({ 
                            session: null,
                            user: null, 
                            userRole: null, 
                            shopId: null, 
                            shopInfo: null, 
                            isLoading: false, 
                            error: null 
                        })
                    }
                }
            } catch (error) {
                console.error('AUTH PROVIDER - Error getting session:', error)
                if (mounted) {
                    setState({
                        session: null,
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

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log('AUTH PROVIDER - Event:', event, 'Has session:', !!session)

                if (event === 'SIGNED_IN' && session) {
                    // User just signed in - load their data
                    setState(prev => ({ ...prev, isLoading: true }))
                    await loadUserData(session)
                } else if (event === 'SIGNED_OUT') {
                    // User signed out - clear state
                    console.log('AUTH PROVIDER - User signed out, clearing state')
                    setState({ 
                        session: null,
                        user: null, 
                        userRole: null, 
                        shopId: null, 
                        shopInfo: null, 
                        isLoading: false, 
                        error: null 
                    })
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    // Token refreshed - update session but keep user data
                    console.log('AUTH PROVIDER - Token refreshed')
                    setState(prev => ({ ...prev, session }))
                }
                // Ignore INITIAL_SESSION - we handle that in loadAuth()
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