import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
	const supabase = await createClient()
	
	// Check if user is authenticated using getClaims()
	const { data, error } = await supabase.auth.getClaims()
	
	if (error || !data?.claims) {
		// Not authenticated, redirect to login
		redirect('/login')
	}
	
	// Authenticated, redirect to work orders
	redirect('/operations/work-orders')
}