import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Root page - redirects authenticated users to work orders, unauthenticated to login
 * Uses getClaims() for fast local JWT validation (no Auth server request)
 */
export default async function Page() {
	const supabase = await createClient()
	
	// Use getClaims() instead of getUser() - validates JWT locally when possible
	// This avoids unnecessary requests to the Auth server
	const { data, error } = await supabase.auth.getClaims()

	if (data?.claims && !error) {
		// User is logged in, redirect to work orders
		redirect('/operations/work-orders')
	} else {
		// User is not logged in, redirect to login
		redirect('/login')
	}
}