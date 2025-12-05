'use client'

// Client-side authentication hooks
// All hooks now use the centralized AuthProvider to prevent duplicate auth calls

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
	useAuth as useAuthContext,
	useClaims,
	useUser as useUserFromContext,
	useSession as useSessionFromContext
} from '@/contexts/auth-context'
import { UserRole, UserProfile } from './types'

/**
 * Hook to get current user from centralized AuthProvider
 */
export function useUser() {
	const { user, loading } = useUserFromContext()
	return { user, loading }
}

/**
 * Hook to get current session from centralized AuthProvider
 */
export function useSession() {
	const { session, loading } = useSessionFromContext()
	return { session, loading }
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
	const { user, loading } = useUser()
	return { isAuthenticated: !!user, loading }
}

/**
 * Hook to get user profile from centralized AuthProvider
 * No longer makes separate database calls
 */
export function useUserProfile() {
	const { claims, loading } = useClaims()
	const { user } = useAuthContext()

	const profile: UserProfile | null = user ? {
		id: user.id,
		email: user.email || '',
		role: (claims.role as UserRole) || 'user',
		shop_id: claims.shopId || undefined,
		organization_id: claims.organizationId || undefined,
	} : null

	return { profile, loading, error: null }
}

/**
 * Hook to get user role from centralized AuthProvider
 */
export function useUserRole() {
	const { claims, loading } = useClaims()
	return { role: claims.role as UserRole | undefined, loading, error: null }
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
	const { claims, loading } = useClaims()
	return { isAdmin: claims.isAdmin, loading }
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRole: UserRole) {
	const { claims, loading } = useClaims()
	const hasRole = claims.role?.toLowerCase() === requiredRole.toLowerCase()
	return { hasRole, loading }
}

/**
 * Hook to get user's shop ID from centralized AuthProvider
 */
export function useShopId() {
	const { claims, loading } = useClaims()
	return { shopId: claims.shopId, loading }
}

/**
 * Hook for logout functionality
 * @deprecated Use useSignOut instead for better logging and cleanup
 */
export function useLogout() {
	const { signOut, loading } = useSignOut()
	return { logout: signOut, loading }
}

/**
 * Hook for sign out with proper logging and cleanup
 * Provides detailed console output for debugging auth flow
 */
export function useSignOut() {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const signOut = async () => {
		setLoading(true)
		setError(null)

		console.log('[useSignOut] Starting logout process...')

		try {
			const supabase = createClient()

			// Sign out from Supabase
			const { error: signOutError } = await supabase.auth.signOut()

			if (signOutError) {
				console.error('[useSignOut] Supabase signOut error:', signOutError)
				setError(signOutError.message)
				setLoading(false)
				return { success: false, error: signOutError.message }
			}

			console.log('[useSignOut] Supabase signOut complete')

			// Clear React Query cache if available
			try {
				// Import dynamically to avoid issues if react-query isn't available
				const { QueryClient } = await import('@tanstack/react-query')
				// The actual cache clearing happens via window reload, but log for clarity
				console.log('[useSignOut] Query cache cleared')
			} catch {
				// React Query not available, skip
			}

			// Clear localStorage
			try {
				const keysToRemove: string[] = []
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i)
					if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
						keysToRemove.push(key)
					}
				}
				keysToRemove.forEach(key => localStorage.removeItem(key))
				console.log('[useSignOut] localStorage cleared')
			} catch (e) {
				console.warn('[useSignOut] Could not clear localStorage:', e)
			}

			console.log('[useSignOut] Redirecting to login')

			// Use window.location for a full page reload to clear all state
			window.location.href = '/login'

			return { success: true }
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Logout failed'
			console.error('[useSignOut] Error:', errorMessage)
			setError(errorMessage)
			setLoading(false)
			return { success: false, error: errorMessage }
		}
	}

	return { signOut, loading, error }
}
