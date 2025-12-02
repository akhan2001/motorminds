'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
    user: User | null
    shopId: string | null
    isLoading: boolean
    error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthContextType>({
        user: null,
        shopId: null,
        isLoading: true,
        error: null
    })

    useEffect(() => {
        let mounted = true

        const loadUserData = async (user: User) => {
            try {
                // Fetch shop_id
                const { data, error } = await supabase
                    .from('users')
                    .select('shop_id')
                    .eq('id', user.id)
                    .single()

                if (mounted) {
                    if (error) {
                        console.error('Error fetching shop_id:', error)
                        setState({
                            user,
                            shopId: null,
                            isLoading: false,
                            error: error.message
                        })
                    } else {
                        setState({
                            user,
                            shopId: data?.shop_id || null,
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
                        shopId: null,
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
                    setState({ user: null, shopId: null, isLoading: false, error: null })
                }
            } catch (error) {
                console.error('Error getting session:', error)
                if (mounted) {
                    setState({
                        user: null,
                        shopId: null,
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
                    await loadUserData(session.user)
                } else if (event === 'SIGNED_OUT') {
                    setState({ user: null, shopId: null, isLoading: false, error: null })
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
        <AuthContext.Provider value={state}>
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