import type { UserRole } from '@/types/core/user';
import { useAuth } from '@/contexts/AuthProvider';

/**
 * Hook to get the current user's role from centralized auth context
 * No network calls - reads from AuthProvider context
 * This eliminates the thundering herd problem
 */
export function useUserRole() {
    const { userRole, isLoading } = useAuth();

    return {
        data: userRole,
        isLoading,
        error: null,
        refetch: () => Promise.resolve({ data: userRole })
    };
}
