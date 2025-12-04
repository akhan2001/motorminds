import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Root page - redirects authenticated users to work orders, unauthenticated to login
 */
export default async function Page() {
	const supabase = await createClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (user) {
		// User is logged in, redirect to work orders
		redirect('/operations/work-orders')
	} else {
		// User is not logged in, redirect to login
		redirect('/login')
	}
}