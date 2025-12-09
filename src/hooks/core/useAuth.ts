'use client'

/**
 * Legacy useAuth hook - now re-exports from centralized AuthProvider
 * This maintains backwards compatibility while eliminating redundant API calls
 *
 * IMPORTANT: All components should import from @/contexts/AuthProvider directly
 * This file exists only for backwards compatibility
 */
export { useAuth } from '@/contexts/AuthProvider'
