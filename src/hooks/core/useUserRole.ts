import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types/core/user';

/**
 * Hook to get the current user's role from the centralized AuthProvider.
 * This prevents duplicate auth calls and token refresh storms.
 *
 * @deprecated This hook now uses centralized auth. The old React Query implementation
 * has been replaced to prevent the thundering herd problem.
 */
export function useUserRole() {
    const { userRole, loading } = useAuth();

    return {
        data: userRole as UserRole | null,
        isLoading: loading,
        error: null,
        refetch: () => Promise.resolve({ data: userRole }),
    };
}
