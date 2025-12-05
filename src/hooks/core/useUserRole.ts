import { useAuth } from '@/contexts/auth-provider'
import type { UserRole } from '@/types/core/user'

/**
 * Hook to get user role from centralized AuthProvider
 * This prevents duplicate API calls and "thundering herd" problem
 * 
 * @deprecated Use useAuth() directly instead for better performance
 */
export function useUserRole() {
    const { userRole, loading } = useAuth()
    
    return {
        data: userRole as UserRole | null,
        isLoading: loading,
        error: null,
        refetch: () => Promise.resolve({ data: userRole as UserRole | null })
    }
}
