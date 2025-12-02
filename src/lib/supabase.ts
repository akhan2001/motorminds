import { createBrowserClient } from '@supabase/ssr'

// Singleton client instance to prevent multiple client creation
// This prevents token refresh loops caused by creating new clients on every render
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
	// Return existing instance if available
	if (clientInstance) {
		return clientInstance
	}

	// Create new instance only if it doesn't exist
	clientInstance = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	return clientInstance
}

// Export singleton instance for backward compatibility and direct use
// This ensures all hooks and components use the same client instance
export const supabase = createClient()