/**
 * Core authentication hook - now uses centralized AuthProvider
 * 
 * This hook previously made duplicate API calls to fetch user and shopId.
 * Now it simply re-exports the centralized auth state from AuthProvider,
 * eliminating the "thundering herd" problem.
 */
'use client'

import { useAuth as useAuthContext } from '@/contexts/auth-provider'

export function useAuth() {
    const { user, shopId, loading } = useAuthContext()

    return {
        user,
        shopId,
        isLoading: loading,
        error: null // AuthProvider handles errors internally
    }
}
