import { Nav } from "@/components/navigation/nav"
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Protected layout for all /features routes
 * Validates authentication using getClaims() before rendering
 */
export default async function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()

	// Check authentication using getClaims() (validates JWT signature)
	const { data, error } = await supabase.auth.getClaims()

	if (error || !data?.claims) {
		// Not authenticated, redirect to login
		redirect('/login')
	}

	// Authenticated, render children with Nav
	return (
		<>
			<Nav />
			{children}
		</>
	)
}