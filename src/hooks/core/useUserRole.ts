import { useQuery } from '@tanstack/react-query';
import { createClient } from "@/utils/supabase/client";
import type { UserRole } from '@/types/core/user';
import { useEffect } from 'react';

export function useUserRole() {
    const supabase = createClient();
    
    const query = useQuery({
        queryKey: ['user-role'],
        queryFn: async (): Promise<UserRole | null> => {
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
        refetchOnWindowFocus: true,
        retry: 1, // Retry once if the query fails
    });

    // Listen to auth state changes and refetch when user changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                // Refetch user role when auth state changes
                query.refetch();
            }
        });

        return () => subscription.unsubscribe();
    }, [query]);

    return query;
}
