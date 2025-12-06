'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-provider'
import { clearNavigationHistory } from '@/components/auth/RouteValidationWrapper'

/**
 * Enhanced sign-out hook
 * 
 * Based on Supabase Studio's useSignOut pattern:
 * - Signs out from Supabase
 * - Clears React Query cache
 * - Clears localStorage
 * - Clears navigation history
 * - Redirects to login
 * - Provides detailed logging
 * 
 * @example
 * ```tsx
 * const { signOut, isSigningOut } = useSignOut()
 * 
 * await signOut()
 * ```
 */
export function useSignOut() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { signOut: authSignOut } = useAuth()

    const signOut = useCallback(async () => {
        try {
            console.log('[useSignOut] Starting logout process...')

            // 1. Sign out from Supabase (invalidates session, clears cookies)
            await authSignOut()
            console.log('[useSignOut] Supabase signOut complete')

            // 2. Clear React Query cache (remove all cached API responses)
            queryClient.clear()
            console.log('[useSignOut] Query cache cleared')

            // 3. Clear navigation history
            clearNavigationHistory()
            console.log('[useSignOut] Navigation history cleared')

            // 4. Clear localStorage (remove app-specific data)
            if (typeof window !== 'undefined') {
                // Clear specific keys instead of everything to preserve theme, etc.
                const keysToRemove: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && (
                        key.startsWith('sb-') ||
                        key.includes('supabase') ||
                        key.includes('auth') ||
                        key.startsWith('last_')
                    )) {
                        keysToRemove.push(key)
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key))
                console.log('[useSignOut] localStorage cleared')
            }

            // 5. Redirect handled by AuthProvider SIGNED_OUT event
            console.log('[useSignOut] Logout complete - waiting for SIGNED_OUT event to redirect')

            return { error: null }
        } catch (error) {
            console.error('[useSignOut] Logout failed:', error)
            return { error }
        }
    }, [authSignOut, queryClient, router])

    return signOut
}

// Re-export for backward compatibility
export { useSignOut as default }

