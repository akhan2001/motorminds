// Middleware configuration

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_PATHS = [
  '/signup',
  '/login',
  '/auth',
  '/api/auth',
  '/api/voice-calling/webhook',
  '/customer-intake',
]

/**
 * Protected routes that require authentication
 */
export const PROTECTED_PATHS = [
  '/operations',
  '/financials',
  '/invoices',
  '/mia-ai',
  '/mia',
  '/chat',
  '/customers',
  '/customer-intake',
  '/customer-invoice-intake',
  '/messages',
  '/messaging',
  '/admin',
  '/settings',
  '/parts',
  '/parts-ordering',
  '/suppliers',
  '/voice-calling',
  '/app',
  '/api/financials',
  '/api/mia',
  '/api/voice',
  '/api/suppliers',
  '/api/parts',
]

/**
 * Admin-only routes
 */
export const ADMIN_PATHS = ['/admin']

/**
 * Paths to redirect demo users
 */
export const DEMO_REDIRECT_PATHS = ['/', '/dashboard']
