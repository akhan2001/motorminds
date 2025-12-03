'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

/**
 * Centralized sign out hook following Supabase Studio pattern.
 * 
 * Cleanup order (critical for proper logout):
 * 1. gotrueClient.signOut() - invalidates session on server, clears cookies
 * 2. queryClient.clear() - clears React Query cache
 * 3. localStorage.clear() - removes app-specific data
 * 4. router.push('/login') - redirects to login
 * 
 * This matches Studio's useSignOut implementation exactly.
 */
export function useSignOut() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    try {
      console.log('[useSignOut] Starting logout process...')
      const supabase = createClient()

      // 1. Sign out from Supabase (invalidates session, clears cookies)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('[useSignOut] Supabase signOut error:', error)
        throw error
      }
      console.log('[useSignOut] Supabase signOut complete')

      // 2. Clear React Query cache (remove all cached API responses)
      queryClient.clear()
      console.log('[useSignOut] Query cache cleared')

      // 3. Clear localStorage (remove app-specific data)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        console.log('[useSignOut] localStorage cleared')
      }

      // 4. Redirect to login
      console.log('[useSignOut] Redirecting to login')
      router.push('/login')

      return { error: null }
    } catch (error) {
      console.error('[useSignOut] Logout failed:', error)
      return { error }
    }
  }, [queryClient, router])
}

