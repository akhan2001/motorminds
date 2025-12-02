// Legacy hook - now uses unified auth context
// Keeping this file for backward compatibility
import { useUnifiedAuth } from '@/contexts/unified-auth-context';

export function useUserRole() {
    const { role, isLoading } = useUnifiedAuth();

    return {
        data: role,
        isLoading,
        error: null,
        refetch: () => Promise.resolve(), // No-op for backward compatibility
    };
}
