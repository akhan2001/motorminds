import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Minimal Middleware for Supabase SSR (following Supabase Studio pattern)
 * 
 * Responsibilities:
 * 1. Handle CORS preflight (OPTIONS) requests
 * 2. Refresh auth tokens (cookie management only)
 * 3. Simple redirect for unauthenticated users on protected routes
 * 
 * What this does NOT do:
 * - ❌ NO database queries (shop_id, role checks)
 * - ❌ NO complex authorization logic
 * - ❌ NO response recreation in setAll
 * 
 * Heavy logic moved to:
 * - Server components/layouts (shop_id, role checks)
 * - API routes (authorization)
 * - Client-side (AuthProvider, withAuth HOC)
 */

// Allowed origins for CORS
const allowedOrigins = [
	'http://localhost:3000',
	'http://localhost:3001',
	'https://motorminds.vercel.app',
	'https://app.motorminds.ca',
	process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean) as string[]

const corsOptions = {
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
	'Access-Control-Allow-Credentials': 'true',
}

export async function updateSession(request: NextRequest) {
	const origin = request.headers.get('origin') ?? ''
	const isAllowedOrigin = allowedOrigins.includes(origin)

	// Handle preflight OPTIONS requests
	if (request.method === 'OPTIONS') {
		return NextResponse.json({}, {
			headers: {
				...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
				...corsOptions,
			}
		})
	}

	// Create response - canonical Supabase SSR pattern
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	})

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					// Set cookies on request for Server Components
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					)
					// Set cookies on response to send to browser
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					)
				},
			},
		}
	)

	// Public routes that don't require authentication
	const publicPaths = [
		'/signup',
		'/login',
		'/logout',
		'/auth',
		'/api/auth',
		'/api/voice-calling/webhook',
		'/customer-intake',
	]

	// Skip auth checks for public routes - just refresh cookies and return
	if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
		// Add CORS headers if needed
		if (isAllowedOrigin) {
			response.headers.set('Access-Control-Allow-Origin', origin)
		}
		Object.entries(corsOptions).forEach(([key, value]) => {
			response.headers.set(key, value)
		})
		return response
	}

	// IMPORTANT: getClaims() validates JWT signature and refreshes tokens
	// This MUST be called to prevent random logouts with SSR
	const { data } = await supabase.auth.getClaims()
	const user = data?.claims ? {
		id: data.claims.sub,
		email: data.claims.email,
	} : null

	// Protected routes that require authentication
	const protectedPaths = [
		'/operations',
		'/financials',
		'/invoices',
		'/mia-ai',
		'/mia',
		'/chat',
		'/customers',
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

	const isProtectedPath = protectedPaths.some(path =>
		request.nextUrl.pathname.startsWith(path)
	)

	// Redirect to login if accessing protected route without auth
	if (isProtectedPath && !user) {
		const redirectUrl = new URL('/login', request.url)
		redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
		return NextResponse.redirect(redirectUrl)
	}

	// Add user ID to headers for downstream use (if authenticated)
	if (user) {
		response.headers.set('x-user-id', user.id)
	}

	// Add CORS headers to response if origin is allowed
	if (isAllowedOrigin) {
		response.headers.set('Access-Control-Allow-Origin', origin)
	}

	Object.entries(corsOptions).forEach(([key, value]) => {
		response.headers.set(key, value)
	})

	return response
}