import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware Proxy for Supabase SSR
 * 
 * This proxy is responsible for:
 * 1. Refreshing the Auth token by calling supabase.auth.getClaims()
 * 2. Passing the refreshed Auth token to Server Components (via request.cookies.set)
 * 3. Passing the refreshed Auth token to the browser (via response.cookies.set)
 * 
 * IMPORTANT: Always use getClaims() to protect pages - it validates the JWT signature.
 * Never trust getSession() in server code - it doesn't revalidate the auth token.
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
		const preflightHeaders = {
			...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
			...corsOptions,
		}
		return NextResponse.json({}, { headers: preflightHeaders })
	}

	let supabaseResponse = NextResponse.next({
		request,
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
					// Set cookies on request first (for immediate use in Server Components)
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
					
					// Recreate response with updated request
					supabaseResponse = NextResponse.next({
						request,
					})
					
					// Set cookies on response (to send back to browser)
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					)
				},
			},
		}
	)

	// Public routes that should not trigger authentication checks
	const publicPaths = [
		'/signup',
		'/login',
		'/auth',
		'/api/auth',
		'/api/voice-calling/webhook',
		'/customer-intake',
	]

	// Skip authentication checks for public routes
	if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
		return supabaseResponse;
	}

	// IMPORTANT: Do not run code between createServerClient and supabase.auth.getClaims()
	// A simple mistake could make it very hard to debug issues with users being randomly logged out.
	// IMPORTANT: If you remove getClaims() with SSR, users may be randomly logged out.
	
	// Use getClaims() as per official Supabase docs (validates JWT locally when possible)
	const { data, error: claimsError } = await supabase.auth.getClaims()
	const user = data?.claims ? {
		id: data.claims.sub,
		email: data.claims.email,
		user_metadata: data.claims.user_metadata || {},
		app_metadata: data.claims.app_metadata || {},
	} : null

	// Protected routes - keeping your existing logic
	const protectedPaths = [
		'/operations',
		'/financials',
		'/invoices',        // Invoice management
		'/mia-ai',          // Mia AI routes
		'/mia',             // MIA diagnostic interface
		'/chat',
		'/customers',       // Customer management
		'/customer-intake', // Customer intake form
		'/customer-invoice-intake',  // Customer invoice intake form
		'/messages',
		'/messaging',
		'/admin',
		'/settings',        // Settings pages
		'/parts',           // New refactored parts ordering
		'/parts-ordering',  // Original parts ordering  
		'/suppliers',       // Supplier management
		'/voice-calling',   // Voice calling interface
		'/app',             // All app routes (appointments, invoices, etc.)
		'/api/financials',
		'/api/mia',         // MIA API routes
		'/api/voice',       // Voice calling API
		'/api/suppliers',   // Supplier API
		'/api/parts',       // Parts API
	]
	const isProtectedPath = protectedPaths.some(path =>
		request.nextUrl.pathname.startsWith(path)
	)

	if (isProtectedPath && !user) {
		const redirectUrl = new URL('/login', request.url)
		redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
		return NextResponse.redirect(redirectUrl)
	}

	// Shop ID verification for authenticated users on protected paths
	if (isProtectedPath && user) {
		let shopId = user.user_metadata?.shop_id;

		if (!shopId) {
			// Query the users table to get shop_id
			try {
				const { data: userData, error } = await supabase
					.from('users')
					.select('shop_id')
					.eq('id', user.id)
					.single();

				if (!error && userData?.shop_id) {
					shopId = userData.shop_id;
				}
			} catch (error) {
				console.error('Error fetching user shop_id:', error);
			}
		}

		if (!shopId) {
			// User is authenticated but has no shop - redirect to dashboard instead
			const redirectUrl = new URL('/dashboard', request.url)
			return NextResponse.redirect(redirectUrl)
		}

		// Add shop context to request headers for downstream use
		supabaseResponse.headers.set('x-user-id', user.id)
		supabaseResponse.headers.set('x-shop-id', shopId)
	}

	// Admin access control - only admin users can access /admin routes
	if (request.nextUrl.pathname.startsWith('/admin') && user) {
		try {
			// Use server-side Supabase client for database query
			const { data: userData, error } = await supabase
				.from('users')
				.select('role, organization_id')
				.eq('id', user.id)
				.single();

			if (error || !userData) {
				console.log('Error or no userData, redirecting to operations/appointments');
				const redirectUrl = new URL('/operations/appointments', request.url)
				return NextResponse.redirect(redirectUrl)
			}

			// Allow admin roles: 'admin', 'super-admin', 'super_admin', 'shop_admin', 'organization_admin'
			const userRole = userData.role?.toUpperCase();
			const isAdmin =
				userRole === 'ADMIN' ||
				userRole === 'SUPER-ADMIN' ||
				userRole === 'SUPER_ADMIN' ||
				userRole === 'SHOP_ADMIN' ||
				userRole === 'ORGANIZATION_ADMIN';

			if (!isAdmin) {
				// User is not admin - redirect to operations/appointments
				const redirectUrl = new URL('/operations/appointments', request.url)
				return NextResponse.redirect(redirectUrl)
			}
		} catch (error) {
			console.error('Error checking user role for admin access:', error);
			// On error, redirect to safe page
			const redirectUrl = new URL('/operations/appointments', request.url)
			return NextResponse.redirect(redirectUrl)
		}
	}

	// Demo user redirects - redirect from / and /dashboard to /mia
	if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/dashboard')) {
		try {
			const { data: userData, error } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();

			if (!error && userData?.role === 'demo') {
				const redirectUrl = new URL('/mia', request.url)
				return NextResponse.redirect(redirectUrl)
			}
		} catch (error) {
			console.error('Error checking user role for demo redirect:', error);
		}
	}

	// Add CORS headers to response if origin is allowed
	if (isAllowedOrigin) {
		supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
	}

	Object.entries(corsOptions).forEach(([key, value]) => {
		supabaseResponse.headers.set(key, value)
	})

	// IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
	// creating a new response object with NextResponse.next() make sure to:
	// 1. Pass the request in it, like so:
	//    const myNewResponse = NextResponse.next({ request })
	// 2. Copy over the cookies, like so:
	//    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
	// 3. Change the myNewResponse object to fit your needs, but avoid changing
	//    the cookies!
	// 4. Finally:
	//    return myNewResponse
	// If this is not done, you may be causing the browser and server to go out
	// of sync and terminate the user's session prematurely!
	return supabaseResponse;
}