import { createBrowserClient } from '@supabase/ssr'

// Official Supabase SSR pattern - let the library handle cookies automatically
export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)
}

// Kept for backwards compatibility
export function resetClient() {
	// No-op
}