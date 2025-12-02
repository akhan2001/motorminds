// Custom hook for authentication in operations
// Now uses unified auth context
'use client'

import { useUnifiedAuth } from '@/contexts/unified-auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthState {
    user: any | null
    shopId: string | null
    isLoading: boolean
    error: string | null
}

export function useAuth(): AuthState {
    const router = useRouter()
    const { user, shopInfo, isLoading, error } = useUnifiedAuth()

    // Redirect to login if no user after loading completes
    useEffect(() => {
        if (!isLoading && !user) {
            console.error('No authenticated user found')
            router.push('/login')
        }
    }, [user, isLoading, router])

    return {
        user,
        shopId: shopInfo?.id || null,
        isLoading,
        error: !shopInfo && !isLoading ? 'No shop associated with this user' : error
    }
}
