"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
	ChevronRight,
	PanelLeftDashed
} from "lucide-react"
import { sidebarNavSections, type NavSection } from "@/data/configs/sidebar-navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"

type SidebarBehavior = "expandable" | "open" | "closed"

interface SidebarNavProps {
	userRole?: string
	isOpen: boolean
	setOpen: (open: boolean) => void
	behavior: SidebarBehavior
	onBehaviorChange: () => void
}

export function SidebarNav({ userRole, isOpen, setOpen, behavior, onBehaviorChange }: SidebarNavProps) {
	const router = useRouter()
	const pathname = usePathname()

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
		if (behavior === "expandable") {
			setOpen(true)
		}
	}

	const handleMouseLeave = () => {
		if (behavior === "expandable") {
			setOpen(false)
		}
	}

	const getBehaviorTooltip = () => {
		if (behavior === "expandable") return "Click to lock open"
		if (behavior === "open") return "Click to unlock (hover mode)"
		return "Click to unlock (hover mode)"
	}

	return (
		<aside
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"h-screen bg-card dark:bg-[#1a1a1a] border-r border-border dark:border-[#2a2a2a] transition-all duration-300 ease-in-out",
				isOpen ? "w-64" : "w-16"
			)}
		>
			<div className="flex flex-col h-full">
				{/* Spacer for nav height (py-6 = 24px top + 24px bottom = 48px + content ~33px = ~81px) */}
				{/* <div className="h-[81px]" /> */}

				{/* Navigation Items */}
				<nav className="flex-1 overflow-y-auto">
					<div className="p-2">
						{sidebarNavSections.map((section, sectionIndex) => (
							<React.Fragment key={section.title}>
								{/* Separator before each section except the first */}
								{sectionIndex > 0 && (
									<Separator className="w-[calc(100%-1rem)] mx-auto my-2" />
								)}

								{/* Section Group */}
								<div className="relative flex w-full min-w-0 flex-col gap-0.5">
									<ul className="flex w-full min-w-0 flex-col gap-0.5">
										{section.items.map((item) => {
											const Icon = item.icon
											const active = isActive(item.href)

											return (
												<li key={item.name} className="group/menu-item relative">
													<button
														onClick={() => handleNavClick(item.href)}
														className={cn(
															"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md text-left text-sm outline-none transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 active:bg-accent active:text-foreground disabled:pointer-events-none disabled:opacity-50 h-9",
															isOpen ? "px-2" : "justify-center px-2",
															active
																? "bg-red-600 text-white shadow-sm hover:bg-red-600 hover:text-white"
																: "text-muted-foreground dark:hover:bg-accent/50"
														)}
														title={!isOpen ? item.name : undefined}
													>
														<Icon className={cn(
															"h-4 w-4 flex-shrink-0",
															!isOpen && "mx-auto"
														)} />
														{isOpen && (
															<>
																<span className="flex-1 text-left text-sm font-medium truncate leading-5">{item.name}</span>
																{active && <ChevronRight className="h-3 w-3 flex-shrink-0 ml-auto" />}
															</>
														)}
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

				{/* Sidebar Behavior Toggle Button */}
				<div className={cn("border-t border-border dark:border-[#2a2a2a]", isOpen ? "p-4" : "p-2")}>
					<div className={cn("flex", isOpen ? "justify-end px-2" : "justify-center")}>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={onBehaviorChange}
										className={cn(
											"h-8 w-8",
											behavior === "expandable" && "text-muted-foreground",
											behavior === "open" && "text-blue-600 dark:text-blue-400",
											behavior === "closed" && "text-gray-600 dark:text-gray-400"
										)}
									>
										<PanelLeftDashed className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="right" sideOffset={8}>
									<p>{getBehaviorTooltip()}</p>
									<p className="text-xs text-muted-foreground mt-1">
										Current: {behavior}
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</div>
		</aside>
	)
}
