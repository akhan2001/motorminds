'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Nav } from "@/components/navigation/nav"
import { useUnifiedAuth } from '@/contexts/unified-auth-context'

/**
 * Protected layout for all feature pages.
 * Automatically redirects to login if not authenticated.
 * This eliminates the need for withAuth HOC on individual pages.
 */
export default function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const pathname = usePathname()
	const { user, shopInfo, isLoading } = useUnifiedAuth()

	// Check authentication
	const isAuthenticated = Boolean(user)
	const hasRequiredData = Boolean(shopInfo?.id)
	const shouldRedirect = !isLoading && (!isAuthenticated || !hasRequiredData)

	useEffect(() => {
		if (shouldRedirect) {
			// console.log('[FeaturesLayout] Redirecting to login, returnTo:', pathname)
			const loginUrl = `/login?returnTo=${encodeURIComponent(pathname)}`
			router.push(loginUrl)
		}
	}, [shouldRedirect, pathname, router])

	// Show nothing while checking auth or redirecting
	// This prevents any flash of protected content
	if (isLoading || shouldRedirect) {
		return null
	}

	// User is authenticated, render the layout
	return (
		<>
			<Nav />
			{children}
		</>
	)
}

