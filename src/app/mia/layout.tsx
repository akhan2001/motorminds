"use client"

import { useState, useEffect } from "react"
import { Nav } from "@/components/navigation/nav"
import { SidebarNav } from "@/components/navigation/sidebar-nav"

const SIDEBAR_BEHAVIOR_KEY = "SIDEBAR_BEHAVIOR"
type SidebarBehavior = "expandable" | "open" | "closed"

export default function MiaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	// Initialize sidebar behavior from localStorage
	const [sidebarBehavior, setSidebarBehavior] = useState<SidebarBehavior>(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(SIDEBAR_BEHAVIOR_KEY) as SidebarBehavior
			return stored || "expandable"
		}
		return "expandable"
	})

	// Initialize sidebar open state based on behavior
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(SIDEBAR_BEHAVIOR_KEY) as SidebarBehavior
			const behavior = stored || "expandable"
			if (behavior === "open") return true
			if (behavior === "closed") return false
			return false // expandable starts collapsed
		}
		return false
	})

	// Update sidebar open state when behavior changes
	useEffect(() => {
		if (sidebarBehavior === "open") {
			setSidebarOpen(true)
		} else if (sidebarBehavior === "closed") {
			setSidebarOpen(false)
		}
		// For 'expandable', don't change the current state
	}, [sidebarBehavior])

	// Save behavior to localStorage when it changes
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(SIDEBAR_BEHAVIOR_KEY, sidebarBehavior)
		}
	}, [sidebarBehavior])

	const handleSidebarBehaviorChange = () => {
		// Toggle between expandable (hovering) and open (locked)
		if (sidebarBehavior === "expandable") {
			setSidebarBehavior("open")
		} else if (sidebarBehavior === "open") {
			setSidebarBehavior("expandable")
		} else {
			// If somehow in "closed" mode, go to expandable
			setSidebarBehavior("expandable")
		}
	}

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
			<div className="flex flex-1 overflow-hidden">
				<SidebarNav
					isOpen={sidebarOpen}
					setOpen={setSidebarOpen}
					behavior={sidebarBehavior}
					onBehaviorChange={handleSidebarBehaviorChange}
				/>
				<main className="flex-1 overflow-auto">
					{children}
				</main>
			</div>
		</div>
	)
}

