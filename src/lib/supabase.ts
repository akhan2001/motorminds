import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookieOptions: {
				// Force secure cookies (required for HTTPS/Vercel)
				secure: true,
				sameSite: 'lax',
				path: '/',
			}
		}
	)
}

// Export instance for backward compatibility with existing files
export const supabase = createClient()