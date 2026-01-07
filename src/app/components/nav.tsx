"use client"

import { createClient } from "@/utils/supabase/client"
import { Settings, ChevronDown, MessageCircleMore, Sparkles } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MobileNav } from "./mobile-nav"
import { useQueryClient } from '@tanstack/react-query'
import { useUserRole } from "@/hooks/core/useUserRole"
import { useShopInfo } from "@/hooks/core/useShopInfo"
import { getFilteredNavItems } from "@/lib/utils/navigation"
import { ProfileDropdown } from "@/components/layout/nav/profile-dropdown"
import { FeedbackDropdown } from "@/components/layout/header/FeedbackDropdown/FeedbackDropdown"
import { useAdminContextWithRole } from "@/contexts/admin-context"

export function Nav() {
	const router = useRouter()
	const pathname = usePathname()
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const { data: userRole, isLoading: isLoadingRole } = useUserRole()
	const { data: shopInfo, isLoading: isLoadingShop } = useShopInfo()

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
			shopInfo?.id || undefined
		);
		return items;
	}, [userRole, adminType, shopInfo?.id]);

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
	if (isLoadingRole || isLoadingShop) {
		return (
			<header className="bg-gray-50 dark:bg-[#1a1a1a] px-8 py-4 border-b border-border z-50">
				<nav className="flex items-center justify-between w-full">
					<div className="flex items-center gap-4">
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
		<header className="bg-gray-50 dark:bg-[#1a1a1a] px-8 py-4 border-b border-border z-50">
			<nav className="flex items-center justify-between w-full">
				{/* Left: Logo and Navigation Items - all on same line */}
				<div className="hidden lg:flex items-center gap-8">
					{/* Logo */}
					<div
						className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
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

					{/* Navigation items on same line */}
					<div className="flex items-center gap-2">
						{navItems.map((item) => (
							item.hasDropdown ? (
								<div key={item.name} className="relative">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												className={`px-6 py-2.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap text-sm font-medium ${activeLink === item.name
														? "bg-blue-600 text-white shadow-md"
														: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
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
								<button
									key={item.name}
									onClick={() => handleNavClick(item.name, item.href)}
									className={`px-6 py-2.5 rounded-full flex items-center gap-1.5 transition-all group whitespace-nowrap text-sm font-medium ${activeLink === item.name
											? "bg-blue-600 text-white shadow-md"
											: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
										} ${item.name === 'Mia AI' ? 'hover:bg-red-500 hover:text-white hover:animate-pulse' : ''}`}
								>
									{item.name}
									{item.name === 'Mia AI' && (
										<Sparkles className={`h-3 w-3 transition-colors ${activeLink === item.name ? 'text-white' : 'group-hover:text-white'
											}`} />
									)}
								</button>
							)
						))}
					</div>
				</div>

				{/* Right: Actions + Profile */}
				<div className="hidden lg:flex items-center gap-4">
					{/* Full navigation for non-demo users */}
					{userRole !== 'demo' && (
						<>
							<button
								className={`${activeLink === "Messages" ? "text-foreground" : "text-muted-foreground"
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