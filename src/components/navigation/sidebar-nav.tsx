"use client"

import React, { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronRight, PanelLeftDashed } from "lucide-react"
import { sidebarNavSections } from "@/data/configs/sidebar-navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocalStorage } from "@/hooks/use-local-storage"

export type SidebarBehaviourType = "expandable" | "open" | "closed"
export const DEFAULT_SIDEBAR_BEHAVIOR: SidebarBehaviourType = "expandable"
export const SIDEBAR_BEHAVIOR_KEY = "SIDEBAR_BEHAVIOR"

interface SidebarNavProps {
	userRole?: string
	isOpen: boolean
	setOpen: (open: boolean) => void
}

export function SidebarNav({ isOpen, setOpen }: SidebarNavProps) {
	const router = useRouter()
	const pathname = usePathname()

	const [sidebarBehaviour, setSidebarBehaviour] = useLocalStorage<SidebarBehaviourType>(
		SIDEBAR_BEHAVIOR_KEY,
		DEFAULT_SIDEBAR_BEHAVIOR
	)

	const sidebarBehaviourRef = useRef(sidebarBehaviour)
	const dropdownOpenRef = useRef(false)
	sidebarBehaviourRef.current = sidebarBehaviour

	// Sync localStorage behavior with UI state (locked when 'open' or 'closed')
	useEffect(() => {
		if (sidebarBehaviour === "open") setOpen(true)
		if (sidebarBehaviour === "closed") setOpen(false)
	}, [sidebarBehaviour, setOpen])

	const handleNavClick = (href: string) => {
		router.push(href)
	}

	const isActive = (href: string) => {
		if (href === "/") {
			return pathname === href
		}
		return pathname.startsWith(href)
	}

	const handleMouseEnter = () => {
		if (sidebarBehaviourRef.current === "expandable") setOpen(true)
	}

	const handleMouseLeave = () => {
		if (dropdownOpenRef.current) return
		if (sidebarBehaviourRef.current === "expandable") setOpen(false)
	}

		return (
		<aside
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"group h-screen bg-card dark:bg-[#1a1a1a] border-r border-border dark:border-[#2a2a2a] transition-all duration-[400ms] ease-in-out",
				isOpen ? "w-64" : "w-16"
			)}
			data-state={isOpen ? "expanded" : "collapsed"}
		>
			<div className="flex flex-col h-full">
				{/* Navigation Items */}
				<nav className="flex-1 overflow-y-auto">
					<div className="p-2">
						{sidebarNavSections.map((section, sectionIndex) => (
							<React.Fragment key={section.title}>
								{sectionIndex > 0 && (
									<Separator className="w-[calc(100%-1rem)] mx-auto my-2" />
								)}

								<div className="relative flex w-full min-w-0 flex-col gap-0.5">
									<ul className="flex w-full min-w-0 flex-col gap-0.5">
										{section.items.map((item) => {
											const Icon = item.icon
											const active = isActive(item.href)

											return (
												<li key={item.name} className="group/menu-item relative">
													<button
														onClick={() => handleNavClick(item.href)}
														title={sidebarBehaviour === "closed" ? item.name : undefined}
														className={cn(
															"relative h-10 w-full overflow-hidden rounded-md text-left text-sm outline-none transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 active:bg-accent active:text-foreground disabled:pointer-events-none disabled:opacity-50",
															isOpen && "pr-2",
															active
																? "bg-red-600 text-white shadow-sm hover:bg-red-600 hover:text-white"
																: "text-muted-foreground dark:hover:bg-accent/50"
														)}
													>
														{/* Icon: fixed at left-0, never moves */}
														<span className="absolute left-0 top-0 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded">
															<Icon className="h-4 w-4 flex-shrink-0" />
														</span>
														{/* Text: fades in/out, positioned to the right of the icon */}
														<span
															className={cn(
																"absolute left-10 right-2 top-0 flex h-10 items-center gap-1 transition-opacity duration-200",
																isOpen ? "opacity-100" : "opacity-0"
															)}
														>
															<span className="min-w-0 flex-1 truncate text-sm font-medium">
																{item.name}
															</span>
															{active && (
																<ChevronRight className="h-3 w-3 flex-shrink-0" />
															)}
														</span>
													</button>
												</li>
											)
										})}
									</ul>
								</div>
							</React.Fragment>
						))}
					</div>
				</nav>

				{/* Sidebar control: Dropdown with Expanded / Collapsed / Expand on hover */}
				<div
					className={cn(
						"border-t border-border dark:border-[#2a2a2a]",
						isOpen ? "p-4" : "p-2"
					)}
				>
					<div className={cn("flex", isOpen ? "justify-end px-2" : "justify-center")}>
						<DropdownMenu onOpenChange={(open) => { dropdownOpenRef.current = open }}>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-8 w-8 w-min px-1.5 mx-0.5",
										sidebarBehaviour === "open" && "!px-2"
									)}
								>
									<PanelLeftDashed className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="start" className="w-40">
								<DropdownMenuRadioGroup
									value={sidebarBehaviour}
									onValueChange={(value) =>
										setSidebarBehaviour(value as SidebarBehaviourType)
									}
								>
									<DropdownMenuLabel>Sidebar control</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuRadioItem value="open">Expanded</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="closed">Collapsed</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="expandable">
										Expand on hover
									</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</aside>
	)
}
