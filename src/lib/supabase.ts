import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					if (typeof document === 'undefined') return []
					
					// Parse all cookies from document.cookie
					return document.cookie.split('; ').map(cookie => {
						const [name, ...valueParts] = cookie.split('=')
						return {
							name,
							value: valueParts.join('=')
						}
					}).filter(c => c.name) // Remove empty entries
				},
				setAll(cookiesToSet) {
					if (typeof document === 'undefined') return
					
					cookiesToSet.forEach(({ name, value, options }) => {
						// Build cookie string with FORCED secure flag
						const parts = [`${name}=${value}`]
						
						if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`)
						if (options?.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`)
						parts.push('Path=/') // Always use root path
						parts.push('SameSite=Lax') // Always use Lax
						parts.push('Secure') // ALWAYS secure (critical for HTTPS)
						
						document.cookie = parts.join('; ')
					})
				},
			}
		}
	)
}

// Export instance for backward compatibility with existing files
export const supabase = createClient()