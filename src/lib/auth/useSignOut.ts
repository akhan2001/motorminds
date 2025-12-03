'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthProvider'

/**
 * Centralized sign out hook following Supabase Studio pattern.
 * 
 * Cleanup order (critical for proper logout):
 * 1. Sign out from Supabase (invalidate session, clear cookies, clear localStorage)
 * 2. Clear React Query cache (remove all cached data)
 * 3. Redirect to login
 * 
 * This ensures:
 * - Session is invalidated on server
 * - No stale data remains in browser
 * - Clean state for next login
 */
export function useSignOut() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const { signOut } = useAuth()

	return useCallback(async () => {
		try {
			console.log('SIGN_OUT - Starting logout process...')

			// 1. Sign out from Supabase (invalidates session, clears cookies & localStorage)
			//    AuthProvider.signOut() handles all cleanup internally
			await signOut()
			console.log('SIGN_OUT - Supabase signOut complete')

			// 2. Clear React Query cache (remove all cached API responses)
			queryClient.clear()
			console.log('SIGN_OUT - Query cache cleared')

			// 3. Redirect to login
			console.log('SIGN_OUT - Redirecting to login')
			router.push('/login')

			return { error: null }
		} catch (error) {
			console.error('SIGN_OUT - Logout failed:', error)
			return { error }
		}
	}, [signOut, queryClient, router])
}

