import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  createAuthGuard,
  createShopGuard,
  createAdminGuard,
  createDemoRedirectGuard,
  GuardContext,
} from '@/lib/auth/guards'
import {
  PUBLIC_PATHS,
  PROTECTED_PATHS,
  ADMIN_PATHS,
  DEMO_REDIRECT_PATHS,
} from '@/lib/auth/middleware-config'

export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	})

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
	)

	// Skip authentication checks for public routes
	if (PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
		return supabaseResponse
	}

	// IMPORTANT: Avoid writing any logic between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make it very hard to debug
	// issues with users being randomly logged out.
	const {
		data: { user },
	} = await supabase.auth.getUser()

	// Create guard context
	const ctx: GuardContext = {
		request,
		response: supabaseResponse,
		supabase,
		user,
	}

	// Initialize guards
	const authGuard = createAuthGuard(PROTECTED_PATHS)
	const shopGuard = createShopGuard(PROTECTED_PATHS)
	const adminGuard = createAdminGuard(ADMIN_PATHS)
	const demoRedirectGuard = createDemoRedirectGuard(DEMO_REDIRECT_PATHS)

	// Run guards in sequence
	const guards = [authGuard, shopGuard, adminGuard, demoRedirectGuard]

	for (const guard of guards) {
		const result = await guard(ctx)
		if (result) {
			// Guard returned a redirect response
			return result
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