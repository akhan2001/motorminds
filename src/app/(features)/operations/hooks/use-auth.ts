// Re-export from centralized AuthProvider to prevent thundering herd
'use client'

/**
 * Legacy useAuth hook for operations folder - now re-exports from centralized AuthProvider
 * This prevents the thundering herd problem by using the global auth context
 *
 * IMPORTANT: This hook previously made redundant API calls. Now it uses the centralized
 * AuthProvider which fetches auth data once and shares it across all components.
 */
export { useAuth } from '@/contexts/AuthProvider'
