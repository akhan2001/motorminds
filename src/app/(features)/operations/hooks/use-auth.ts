// Custom hook for authentication in operations
// Now uses unified auth context
'use client'

import { useUnifiedAuth } from '@/contexts/unified-auth-context'

interface AuthState {
    user: any | null
    shopId: string | null
    isLoading: boolean
    error: string | null
}

export function useAuth(): AuthState {
    const { user, shopInfo, isLoading, error } = useUnifiedAuth()

    // Don't redirect here - middleware already handles auth protection
    // Just return the auth state
    return {
        user,
        shopId: shopInfo?.id || null,
        isLoading,
        error: !shopInfo && !isLoading && user ? 'No shop associated with this user' : error
    }
}
