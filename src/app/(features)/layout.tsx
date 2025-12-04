'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Nav } from "@/components/navigation/nav"
import { useUnifiedAuth } from '@/contexts/unified-auth-context'

export default function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const router = useRouter()
	const pathname = usePathname()
	const { user, shopInfo, isLoading } = useUnifiedAuth()

	const isAuthenticated = Boolean(user)
	const hasRequiredData = Boolean(shopInfo?.id)
	const shouldRedirect = !isLoading && (!isAuthenticated || !hasRequiredData)

	useEffect(() => {
		if (shouldRedirect) {
			const loginUrl = `/login?returnTo=${encodeURIComponent(pathname)}`
			console.log('[FeaturesLayout] Redirecting to login, returnTo:', pathname)
			router.push(loginUrl)
		}
	}, [shouldRedirect, pathname, router])

	// Show nothing while loading or redirecting (prevents content flash)
	if (isLoading || shouldRedirect) {
		return null
	}

	return (
		<>
			<Nav />
			{children}
		</>
	)
}

