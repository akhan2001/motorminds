import { adminGuard } from '@/lib/auth/admin-guard';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
	const startTime = Date.now()
	const requestId = Math.random().toString(36).substring(7)

	console.log(`[${requestId}] START`, {
		path: request.nextUrl.pathname,
		method: request.method,
	})

	// Handle OPTIONS requests immediately (CORS preflight)
	if (request.method === 'OPTIONS') {
		console.log(`[${requestId}] OPTIONS request - returning 200`)
		return new NextResponse(null, {
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Max-Age': '86400',
			}
		})
	}

	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					// CRITICAL: Set cookies on request first (for immediate use)
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value)
					})

					// Recreate response with updated request
					supabaseResponse = NextResponse.next({
						request,
					})

					// Set cookies on response (to send back to browser)
					cookiesToSet.forEach(({ name, value, options }) => {
						supabaseResponse.cookies.set(name, value, {
							...options,
							secure: true, // Force secure flag
							sameSite: 'lax',
						})
					})
				},
			}
		}
	);

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

	// Debug: Check what cookies middleware receives
	const cookies = request.cookies.getAll()
	const authCookie = cookies.find(c => c.name.includes('auth-token'))
	console.log('[Middleware]', {
		path: request.nextUrl.pathname,
		method: request.method,
		hasCookies: cookies.length,
		hasAuthToken: !!authCookie,
		authTokenName: authCookie?.name
	})

	// Use getClaims() as per official Supabase docs (validates JWT locally when possible)
	const { data, error: claimsError } = await supabase.auth.getClaims()
	const user = data?.claims ? {
		id: data.claims.sub,
		email: data.claims.email,
		user_metadata: data.claims.user_metadata || {},
		app_metadata: data.claims.app_metadata || {},
	} : null

	console.log('[Middleware] Auth result:', {
		hasUser: !!user,
		userId: user?.id?.substring(0, 8),
		error: claimsError?.message,
	})

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
		console.log(`[${requestId}] No user, redirecting to /login`, {
			from: request.nextUrl.pathname,
			hasAuthCookie: !!authCookie,
		})
		const redirectUrl = new URL('/login', request.url)
		redirectUrl.searchParams.set('returnTo', request.nextUrl.pathname)
		return NextResponse.redirect(redirectUrl)
	}

	console.log(`[${requestId}] END - User authenticated (${Date.now() - startTime}ms)`)

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