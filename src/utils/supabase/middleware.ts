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

	// IMPORTANT: Avoid writing any logic between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Protected routes - keeping your existing logic
	const protectedPaths = [
		'/obd',
		'/api/simulate-obd',
		'/financials',
		'/api/financials',
		'/parts',           // New refactored parts ordering
		'/parts-ordering',  // Original parts ordering  
		'/suppliers',       // Supplier management
		'/api/suppliers',   // Supplier API
		'/api/parts',       // Parts API
		'/app',             // All app routes (appointments, invoices, etc.)
		'/mia-ai',          // Mia AI routes
		'/dashboard',       // Dashboard routes
		'/customers',       // Customer management
		'/invoices',        // Invoice management
		'/appointments',    // Appointment management
		'/settings',        // Settings pages
		'/loyalty',         // Loyalty program
		'/mechanic-hub',     // Mechanic hub
		'/mia'
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
		// TEMPORARY: Allow parts ordering without shop_id for testing
		const partsOnlyPaths = ['/parts', '/parts-ordering', '/suppliers', '/api/suppliers', '/api/parts']
		const isPartsPath = partsOnlyPaths.some(path =>
			request.nextUrl.pathname.startsWith(path)
		)

		// Get shop_id for all protected routes
		let shopId = user.user_metadata?.shop_id;

		if (!shopId) {
			// Try to get shop_id from users table
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

		if (isPartsPath) {
			// Set headers for parts functionality
			supabaseResponse.headers.set('x-user-id', user.id)
			if (shopId) {
				supabaseResponse.headers.set('x-shop-id', shopId)
			}
		} else {
			// Normal shop_id validation for other protected routes
			if (!shopId) {
				// User is authenticated but has no shop - redirect to dashboard instead
				const redirectUrl = new URL('/dashboard', request.url)
				return NextResponse.redirect(redirectUrl)
			}

			// Add shop context to request headers for downstream use
			supabaseResponse.headers.set('x-user-id', user.id)
			supabaseResponse.headers.set('x-shop-id', shopId)
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