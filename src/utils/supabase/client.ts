import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					if (typeof document === 'undefined') return undefined
					const cookies = document.cookie.split('; ')
					const cookie = cookies.find(c => c.startsWith(`${name}=`))
					return cookie?.split('=')[1]
				},
				set(name: string, value: string, options: CookieOptions) {
					if (typeof document === 'undefined') return
					
					// Build cookie string with FORCED secure flag
					const parts = [`${name}=${value}`]
					
					if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`)
					if (options?.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`)
					parts.push('Path=/') // Always use root path
					parts.push('SameSite=Lax') // Always use Lax
					parts.push('Secure') // ALWAYS secure (works on both HTTP and HTTPS)
					
					document.cookie = parts.join('; ')
				},
				remove(name: string, options: CookieOptions) {
					if (typeof document === 'undefined') return
					this.set(name, '', { ...options, maxAge: 0 })
				},
			}
		}
	)
}

// Kept for backwards compatibility
export function resetClient() {
	// No-op
}