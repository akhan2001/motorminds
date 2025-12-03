import { type NextRequest } from 'next/server'
import { updateSession } from './src/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
	return await updateSession(request)
}

export const config = {
	matcher: [
		/*
		* Match all request paths except for the ones starting with:
		* - _next/ (Next.js internal files including static, image, etc.)
		* - api/auth (auth endpoints handle their own auth)
		* - Static file extensions
		* - favicon and other meta files
		*
		* This prevents middleware from running on static assets which was
		* causing excessive token refresh attempts (thundering herd problem)
		*/
		'/((?!_next/|api/auth|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf|map)$).*)',
	],
}
