import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Protected layout for /operations routes
 * Validates authentication using getClaims() before rendering
 */
export default async function OperationsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()

	// Check authentication using getClaims() (validates JWT signature)
	const { data, error } = await supabase.auth.getClaims()

	if (error || !data?.claims) {
		// Not authenticated, redirect to login with returnTo parameter
		const returnTo = '/operations/work-orders'
		redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
	}

	// Authenticated, render children
	return <>{children}</>
}