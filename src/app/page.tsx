import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Page() {
	const supabase = await createClient()
	
	// Check authentication using getClaims() for robust JWT validation
	const { data } = await supabase.auth.getClaims()
	
	if (!data?.claims?.sub) {
		// Not authenticated - redirect to login
		redirect('/login')
	}
	
	// Authenticated - redirect to work orders
	redirect('/operations/work-orders')
}