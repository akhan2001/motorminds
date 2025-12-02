"use client"

import { createClient } from "@/utils/supabase/client"
import { Settings, ChevronDown, MessageCircleMore, Sparkles } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from "@/lib/auth/AuthProvider"
import { getFilteredNavItems } from "@/lib/utils/navigation"
import { ProfileDropdown } from "@/components/layout/nav/profile-dropdown"
import { FeedbackDropdown } from "@/components/layout/header/FeedbackDropdown/FeedbackDropdown"
import { useAdminContextWithRole } from "@/contexts/admin-context"

export function Nav() {
	const router = useRouter()
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const { user, userRole, shopId, shopInfo, isLoading: isAuthLoading } = useAuth()

	if (!pathname) {
		return null
	}

	// Use cached admin context
	const { adminType } = useAdminContextWithRole(userRole ?? null)

	// Get filtered navigation items based on user role, admin type, and shop ID
	const navItems = useMemo(() => {
		const items = getFilteredNavItems(
			userRole ?? null, 
			adminType || undefined,
			shopId || undefined
		);
		return items;
	}, [userRole, adminType, shopId]);

	let activeLink = ""
	let longestMatch = 0

	for (const item of navItems) {
		const checkHref = (href: string, itemName: string) => {
			const isRoot = href === "/"
			// For root, we need an exact match, otherwise we check for a prefix
			if ((isRoot && pathname === href) || (!isRoot && pathname.startsWith(href))) {
				if (href.length > longestMatch) {
					longestMatch = href.length
					activeLink = itemName
				}
			}
		}

		// If item has sub-items, check their paths first. A match highlights the parent.
		if (item.subItems) {
			for (const subItem of item.subItems) {
				checkHref(subItem.href, item.name)
			}
		}

		// Check the main item itself.
		checkHref(item.href, item.name)
	}

	const handleNavClick = (name: string, href: string) => {
		// For demo users, redirect dashboard clicks to diagnostics page
		if (userRole === 'demo' && (href === '/' || href === '/dashboard' || name === 'Dashboard')) {
			router.push('/mia')
		} else {
			router.push(href)
		}
		setOpen(false) // Close sheet when navigation occurs
	}

	const handleSubItemClick = (parentName: string, href: string) => {
		router.push(href)
		setOpen(false)
	}

	const handleLogout = async () => {
		try {
			const supabase = createClient()
			const { error } = await supabase.auth.signOut()
			
			if (error) {
				console.error("Logout error:", error)
			} else {
				// Clear all React Query cache to ensure fresh data on next login
				queryClient.clear()
				// Force a full page reload to clear all cached data
				window.location.href = "/login"
			}
		} catch (error) {
			console.error("Logout error:", error)
		}
	}

	// Show loading state while fetching role and shop info
	if (isAuthLoading) {
		return (
			<header className="bg-background dark:bg-[#0d0d0d] px-4 pt-2 border-b border-border z-50 sticky top-0">
				<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
					<div className="flex items-center gap-4 py-3">
						<div className="flex items-center gap-2">
							<Image
								src="/motorminds-logo-white (1).svg"
								alt="Motorminds Logo"
								width={35}
								height={35}
								className="w-8 h-8 dark:invert-0 invert"
							/>
							<span className="text-foreground font-medium">Motorminds</span>
						</div>
						<div className="text-muted-foreground text-sm">Loading...</div>
					</div>
				</nav>
			</header>
		);
	}

	return (
		<header className="bg-white dark:bg-[#0d0d0d] px-4 pt-2 border-b border-border z-50 sticky top-0">
			<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
				<div className="flex flex-col items-start">
					{/* Left: Logo and Premium Badge */}
					<div className="flex items-center gap-4 py-3">
						<div 
						className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded-md transition-opacity"
						onClick={() => userRole === 'demo' ? router.push("/mia") : router.push("/")}
						>
							<Image
							src="/motorminds-logo-white (1).svg"
							alt="Motorminds Logo"
							width={35}
							height={35}
							className="w-8 h-8 dark:invert-0 invert"
							/>
							<span className="text-foreground font-medium">Motorminds</span>
						</div>
						<div className="hidden lg:block">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="outline" className="cursor-default text-foreground border-muted-foreground">
										{userRole === 'demo' ? 'Demo' : userRole === 'admin' ? 'Admin' : userRole === 'super' ? 'Super' : 'Premium'}
									</Badge>
								</TooltipTrigger>
								<TooltipContent className="bg-popover text-popover-foreground border-border">
									<p className="text-xs text-[#FBBC05]">
										{userRole === 'demo' && 'Demo Access - Limited Features'}
										{userRole === 'admin' && 'Administrator - Full Access'}
										{userRole === 'super' && 'Super User - Full Access'}
										{userRole === 'user' && 'Premium User - Standard Access'}
										{!userRole && 'Loading user role...'}
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						</div>
					</div>
					{/* Center: Navigation Links */}
					<div className="hidden lg:flex items-center gap-8">
						{navItems.map((item) => (
							item.hasDropdown ? (
								<div key={item.name} className="relative flex flex-col">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button 
												className={`py-2 border-b-2 flex items-center gap-1 ${
													activeLink === item.name
													? "text-[#b22222] border-[#b22222]"
													: "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground transition-colors"
												}`}
											>
												{item.name}
												<ChevronDown className="h-4 w-4" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-popover text-popover-foreground border-border min-w-[180px]">
											{item.subItems && item.subItems.length > 0 ? (
												item.subItems.map((subItem) => (
													<DropdownMenuItem 
														key={subItem.name}
														onClick={() => handleSubItemClick(item.name, subItem.href)}
														className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
													>
														{subItem.name}
													</DropdownMenuItem>
												))
											) : (
												<DropdownMenuItem className="text-muted-foreground cursor-default">
													No items available
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							) : (
								<a
									key={item.name}
									href="#"
									onClick={() => handleNavClick(item.name, item.href)}
									className={`py-2 border-b-2 flex items-center gap-1 group ${
										activeLink === item.name
										? "text-[#b22222] border-[#b22222]"
										: "text-muted-foreground border-transparent hover:border-red-500 transition-colors"
									} ${item.name === 'Mia AI' ? 'text-foreground hover:text-red-500 hover:animate-pulse' : 'hover:text-foreground'}`}
								>
									{item.name}
									{item.name === 'Mia AI' && (
										<Sparkles className="h-3 w-3 text-foreground transition-colors group-hover:text-red-500" />
									)}
								</a>
							)
						))}
					</div>
				</div>
				{/* Right: Actions */}
				<div className="hidden lg:flex items-center gap-4">
					{/* Full navigation for non-demo users */}
					{userRole !== 'demo' && (
						<>
							<button 
								className={`${
									activeLink === "Messages" ? "text-foreground" : "text-muted-foreground"
								} hover:text-foreground transition-colors`} 
								onClick={() => router.push("/messages")}
							>
								<MessageCircleMore className="inline-block w-5 h-5" />
							</button>
							{/* Feedback Dropdown */}
							<FeedbackDropdown />
							<button className="text-muted-foreground hover:text-foreground transition-colors">
								<Settings className="inline-block w-5 h-5" onClick={() => router.push("/settings")} />
							</button>
						</>
					)}
					
					{/* Profile Dropdown - shown for all users */}
					<ProfileDropdown 
						avatar={shopInfo?.logo_image_url || ""}
						shopOwnerName={shopInfo?.shop_owner}
						shopName={shopInfo?.shop_name}
						userRole={userRole || undefined}
					/>
				</div>
				{/* Right: Mobile Menu (only visible on mobile) */}
				<div className="lg:hidden">
					{userRole === 'demo' ? (
						/* Simplified mobile menu for demo users - just profile dropdown */
						<ProfileDropdown 
							avatar={shopInfo?.logo_image_url || ""}
							shopOwnerName={shopInfo?.shop_owner}
							shopName={shopInfo?.shop_name}
							userRole={userRole || undefined}
						/>
					) : (
						/* Full mobile navigation for non-demo users */
						<MobileNav 
							navItems={navItems}
							activeLink={activeLink}
							avatar={shopInfo?.logo_image_url || ""}
							open={open}
							setOpen={setOpen}
							handleNavClick={handleNavClick}
							handleLogout={handleLogout}
						/>
					)}
				</div>
			</nav>
		</header>
	)
}