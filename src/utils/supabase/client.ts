import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance to prevent multiple Supabase clients
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
	// Return existing instance if it exists
	if (supabaseInstance) {
		return supabaseInstance;
	}

	// Create new instance with secure cookie configuration for Vercel
	supabaseInstance = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookieOptions: {
				// Force secure cookies on HTTPS (required for Vercel deployments)
				secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
				sameSite: 'lax',
				path: '/',
			}
		}
	);

	return supabaseInstance;
}

// Reset the singleton instance (used during logout)
export function resetClient() {
	supabaseInstance = null;
}