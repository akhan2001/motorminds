// Custom hook for authentication in operations
// Now uses centralized AuthProvider to prevent duplicate auth calls
'use client'

import { useAuth as useAuthContext, useClaims } from '@/contexts/auth-context'

/**
 * Hook to get auth state from the centralized AuthProvider.
 * This prevents duplicate auth calls and token refresh storms.
 * 
 * @deprecated Use useClaims() from '@/contexts/auth-context' for new code.
 * This hook exists for backwards compatibility with existing operations components.
 */
export function useAuth() {
    const { claims, loading } = useClaims()
    const { user } = useAuthContext()

    return {
        user,
        shopId: claims.shopId,
        isLoading: loading,
        error: null
    }
}
