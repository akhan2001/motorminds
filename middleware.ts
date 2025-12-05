import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
	// CRITICAL: Log to verify middleware is running on Vercel
	console.log('🔥 MIDDLEWARE RUNNING:', request.nextUrl.pathname)
	
	// Handle OPTIONS at the top level (before any other logic)
	if (request.method === 'OPTIONS') {
		console.log('🔥 OPTIONS request detected')
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

	const result = await updateSession(request)
	console.log('🔥 MIDDLEWARE COMPLETE:', result.status)
	return result
}

export const config = {
	matcher: [
		/*
		* Match all request paths except for the ones starting with:
		* - _next/static (static files)
		* - _next/image (image optimization files)
		* - favicon.ico (favicon file)
		* Feel free to modify this pattern to include more paths.
		*/
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
		'/'
	],
}
