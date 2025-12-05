import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for use in the browser (Client Components)
 * This client automatically handles cookie management for auth sessions
 * 
 * Uses the new publishable key (sb_publishable_...) which is recommended over the legacy anon JWT key.
 * Falls back to anon key for backward compatibility during migration.
 */
export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)
}