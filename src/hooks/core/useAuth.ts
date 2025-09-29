'use client'

import { useState, useEffect } from 'react'
import { checkUser } from '@/utils/supabase/supabase-auth'
import { getShopId } from '@/utils/supabase/supabase-shop'
import { useRouter } from 'next/navigation'

interface AuthState {
    user: any | null
    shopId: string | null
    isLoading: boolean
    error: string | null
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        shopId: null,
        isLoading: true,
        error: null
    })
    const router = useRouter()

    useEffect(() => {
        const loadAuth = async () => {
            try {
                setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
                
                const user = await checkUser()
                if (!user) {
                    console.error('No authenticated user found')
                    router.push('/login')
                    return
                }

                const shopId = await getShopId(user.id)
                if (!shopId) {
                    console.error('No shop ID found for user')
                    setAuthState(prev => ({ 
                        ...prev, 
                        isLoading: false, 
                        error: 'No shop associated with this user' 
                    }))
                    return
                }

                setAuthState({
                    user,
                    shopId,
                    isLoading: false,
                    error: null
                })
            } catch (error) {
                console.error('Authentication error:', error)
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: error instanceof Error ? error.message : 'Authentication failed'
                }))
            }
        }

        loadAuth()
    }, [router])

    return authState
}
