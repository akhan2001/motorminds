import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase"; // Use singleton client to prevent refresh loops
import type { UserRole } from '@/types/core/user';
import { useEffect, useRef } from 'react';

export function useUserRole() {
    // Use singleton client instead of creating new one on every render
    // This prevents token refresh loops and multiple auth state subscriptions
    
    const query = useQuery({
        queryKey: ['user-role'],
        queryFn: async (): Promise<UserRole | null> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .maybeSingle(); // Use maybeSingle to handle 406 gracefully

            // Handle errors gracefully - don't throw on 406 or RLS errors
            if (error) {
                // Log but don't throw - return null instead
                if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.warn('Failed to fetch user role:', error);
                }
                return null;
            }
            return data?.role || null;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false, // Changed to false to reduce requests
        refetchOnMount: false,
        retry: false, // Disable retry to prevent rate limiting
    });

    // Use ref to store query refetch function to avoid dependency issues
    const queryRef = useRef(query);
    queryRef.current = query;

    // Listen to auth state changes and refetch when user changes
    // Use empty deps array since supabase is a stable singleton
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
            // Debug logging in development to track auth state changes
            if (process.env.NODE_ENV === 'development') {
                console.log('AUTH CHANGE:', event, session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'no session');
            }
            
            // Only refetch on actual sign in/out, not token refresh
            // Token refresh doesn't mean role changed, and causes rate limiting
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                // Use ref to avoid dependency on query object
                queryRef.current.refetch();
            }
        });

        return () => subscription.unsubscribe();
    }, []); // Empty deps - supabase is a stable singleton, no need to recreate subscription

    return query;
}
