// Auth module exports

// Types
export * from './types'
export * from './schemas'

// Core services
export * from './service'
export * from './roles'

// Caching utilities
export * from './cache'

// NOTE: Server actions are NOT exported here
// Due to Next.js limitations, server actions with 'use server' directive
// cannot be re-exported through barrel exports.
// Import directly from '@/lib/auth/actions' instead:
//   import { loginAction, signupAction, logoutAction } from '@/lib/auth/actions'

// Hooks (client-side only)
export * from './hooks'

// Re-export useClaims from auth context for convenience
export { useClaims, type UserClaims } from '@/contexts/auth-context'

// Guards
export * from './guards'
export * from './middleware-config'
