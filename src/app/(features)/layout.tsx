import { Nav } from "@/components/navigation/nav"
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()
	
	// Check authentication using getClaims() for robust JWT validation
	const { data } = await supabase.auth.getClaims()
	
	if (!data?.claims?.sub) {
		// Not authenticated - redirect to login with returnTo parameter
		const returnTo = '/operations/work-orders'
		redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
	}
	
	return (
		<>
			<Nav />
			{children}
		</>
	)
}

