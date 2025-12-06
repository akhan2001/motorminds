// Custom hook for authentication in operations
// Now uses centralized AuthProvider to avoid duplicate API calls
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
