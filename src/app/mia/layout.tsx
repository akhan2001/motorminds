"use client"

import { useState } from "react"
import { Nav } from "@/components/navigation/nav"
import {
	SidebarNav,
	SIDEBAR_BEHAVIOR_KEY,
	type SidebarBehaviourType,
} from "@/components/navigation/sidebar-nav"

export default function MiaLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(SIDEBAR_BEHAVIOR_KEY) as SidebarBehaviourType | null
			const behavior = stored || "expandable"
			if (behavior === "open") return true
			if (behavior === "closed") return false
			return false
		}
		return false
	})

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Nav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
			<div className="flex flex-1 overflow-hidden">
				<SidebarNav isOpen={sidebarOpen} setOpen={setSidebarOpen} />
				<main className="flex-1 overflow-auto">
					{children}
				</main>
			</div>
		</div>
	)
}

