import { useQuery } from '@tanstack/react-query';
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from '@/types/core/user';

export function useUserRole() {
    return useQuery({
        queryKey: ['user-role'],
        queryFn: async (): Promise<UserRole | null> => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data?.role || null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
