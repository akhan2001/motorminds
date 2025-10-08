import { adminGuard } from '@/lib/auth/admin-guard';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
					supabaseResponse = NextResponse.next({
						request,
					})
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options)
					)
				},
			},
		}
	);

	// Public routes that should not trigger authentication checks
	const publicPaths = [
		'/signup',
		'/login', 
		'/auth',
		'/api/auth',
	    '/api/voice-calling/webhook',
	]
	
	// Skip authentication checks for public routes
	if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
		return supabaseResponse;
	}

	// IMPORTANT: Avoid writing any logic between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Protected routes - keeping your existing logic
	const protectedPaths = [
		// '/admin',
		'/obd',
		'/api/simulate-obd',
		'/financials',
		'/api/financials',
		'/parts',           // New refactored parts ordering
		'/parts-ordering',  // Original parts ordering  
		'/suppliers',       // Supplier management
		'/api/suppliers',   // Supplier API
		'/api/parts',       // Parts API
		'/voice-calling',   // Voice calling interface
		'/api/voice',       // Voice calling API
		'/app',             // All app routes (appointments, invoices, etc.)
		'/mia-ai',          // Mia AI routes
		'/mia',             // MIA diagnostic interface
		'/api/mia',         // MIA API routes
		'/dashboard',       // Dashboard routes
		'/customers',       // Customer management
		'/invoices',        // Invoice management
		'/appointments',    // Appointment management
		'/settings',        // Settings pages
		'/loyalty',         // Loyalty program
		'/mechanic-hub'     // Mechanic hub
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
		// console.log('Checking admin access for user:', user.id);
		
		// Use server-side Supabase client for database query
		const { data: userData, error } = await supabase
			.from('users')
			.select('role')
			.eq('id', user.id)
			.single();

		// console.log('Database query result:', { userData, error });

		if (error || !userData) {
			console.log('Error or no userData, redirecting to operations/appointments');
			const redirectUrl = new URL('/operations/appointments', request.url)
			return NextResponse.redirect(redirectUrl)
		}

		const isAdmin = userData.role?.toUpperCase() === 'ADMIN';
		// console.log('isAdmin result:', isAdmin);
		
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