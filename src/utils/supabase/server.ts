import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for use in Server Components, Server Actions, and Route Handlers
 * 
 * IMPORTANT: Server Components can't write cookies, so the middleware proxy is responsible
 * for refreshing expired auth tokens and storing them.
 * 
 * Always use supabase.auth.getClaims() to protect pages and user data.
 * Never trust supabase.auth.getSession() inside server code - it isn't guaranteed to revalidate the auth token.
 * 
 * Uses the new publishable key (sb_publishable_...) which is recommended over the legacy anon JWT key.
 * Falls back to anon key for backward compatibility during migration.
 */
export async function createClient() {
	const cookieStore = await cookies()

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options)
						)
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		}
	)
}