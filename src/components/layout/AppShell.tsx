"use client"

import { useState } from "react"
import { Nav } from "@/components/navigation/nav"
import {
	SidebarNav,
	SIDEBAR_BEHAVIOR_KEY,
	type SidebarBehaviourType,
} from "@/components/navigation/sidebar-nav"

interface AppShellProps {
	children: React.ReactNode
	/** Content to render before main area (e.g. financials "session active" bar) */
	beforeMain?: React.ReactNode
	/** Hide the sidebar completely */
	hideSidebar?: boolean
}

/**
 * AppShell - Shared layout shell for the main application.
 * Provides consistent Nav + Sidebar + main content structure.
 *
 * Usage:
 * ```tsx
 * <AppShell>
 *   <YourPageContent />
 * </AppShell>
 *
 * // With beforeMain (e.g. session bar)
 * <AppShell beforeMain={<SessionBar />}>
 *   <YourPageContent />
 * </AppShell>
 *
 * // Without sidebar (e.g. widget dashboard)
 * <AppShell hideSidebar>
 *   <YourPageContent />
 * </AppShell>
 * ```
 */
export function AppShell({
	children,
	beforeMain,
	hideSidebar = false,
}: AppShellProps) {
	// Initialize sidebar open state from localStorage
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(
				SIDEBAR_BEHAVIOR_KEY
			) as SidebarBehaviourType | null
			const behavior = stored || "expandable"
			if (behavior === "open") return true
			if (behavior === "closed") return false
			return false // expandable starts closed
		}
		return false
	})

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
			<div className="flex flex-1 overflow-hidden">
				{!hideSidebar && (
					<SidebarNav isOpen={sidebarOpen} setOpen={setSidebarOpen} />
				)}
				<main className="flex-1 overflow-auto">
					{beforeMain}
					{children}
				</main>
			</div>
		</div>
	)
}
