/**
 * Re-export of centralized auth hook
 * This prevents duplicate API calls and "thundering herd" problem
 * 
 * @deprecated Import directly from '@/contexts/auth-provider' instead
 */
'use client'

import { useAuth as useAuthProvider } from '@/contexts/auth-provider'

export function useAuth() {
    const { user, shopId, loading } = useAuthProvider()
    
    return {
        user,
        shopId,
        isLoading: loading,
        error: null
    }
}
