"use client"

import { createClient } from "@/utils/supabase/client"
import { Settings, ChevronDown, MessageCircleMore, Sparkles, Menu, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { useQueryClient } from '@tanstack/react-query'
import { useUserRole } from "@/hooks/core/useUserRole"
import { useShopInfo } from "@/hooks/core/useShopInfo"
import { getFilteredNavItems } from "@/lib/utils/navigation"
import { ProfileDropdown } from "@/components/layout/nav/profile-dropdown"
import { FeedbackDropdown } from "@/components/layout/header/FeedbackDropdown/FeedbackDropdown"
import { useAdminContextWithRole } from "@/contexts/admin-context"

interface NavProps {
	sidebarOpen?: boolean
	setSidebarOpen?: (open: boolean) => void
}

export function Nav({ sidebarOpen, setSidebarOpen }: NavProps = {}) {
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
		// For demo branch: only show first 4 items (Appointments, Work Orders, AI Diagnostics, Invoices)
		return items.slice(0, 4);
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
			<header className="bg-gray-50 dark:bg-[#1a1a1a] px-8 py-6 border-b border-border z-50 flex-shrink-0">
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
							<h1 className="text-foreground font-bold text-lg">MotorMinds</h1>
						</div>
						<div className="text-muted-foreground text-sm">Loading...</div>
					</div>
				</nav>
			</header>
		);
	}

	return (
		<header className="bg-gray-50 dark:bg-[#1a1a1a] px-4 py-6 border-b border-border dark:border-[#2a2a2a] z-50 flex-shrink-0">
			<nav className="flex items-center justify-between w-full">
				{/* Left: Hamburger + Logo */}
				<div className="hidden lg:flex items-center gap-3">
					{setSidebarOpen && (
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="p-2 rounded-lg hover:bg-accent hover:text-foreground transition-colors duration-200"
							aria-label="Toggle sidebar"
						>
							{sidebarOpen ? (
								<X className="h-5 w-5 text-foreground" />
							) : (
								<Menu className="h-5 w-5 text-foreground" />
							)}
						</button>
					)}
					<div
						className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
						onClick={() => userRole === 'demo' ? router.push("/mia") : router.push("/")}
					>
						<Image
							src="/motorminds-logo-white (1).svg"
							alt="Motorminds Logo"
							width={35}
							height={35}
							className="w-8 h-8 dark:invert-0 invert"
						/>
						<h1 className="text-foreground font-bold text-lg m-0">MotorMinds</h1>
					</div>
				</div>

				{/* Center: Navigation items */}
				<div className="hidden lg:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
					{navItems.map((item) => (
						item.hasDropdown ? (
							<div key={item.name} className="relative">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button
											className={`px-6 py-2.5 rounded-full flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap text-sm font-medium ${
												activeLink === item.name
												? "bg-red-600 text-white shadow-md"
												: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/50"
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
													className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
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
								className={`px-6 py-2.5 rounded-full flex items-center gap-1.5 transition-all duration-200 group whitespace-nowrap text-sm font-medium ${
									activeLink === item.name
									? "bg-red-600 text-white shadow-md"
									: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent/50"
								} ${item.name === 'Mia AI' ? 'hover:bg-red-500 hover:text-white hover:animate-pulse' : ''}`}
							>
								{item.name}
								{item.name === 'Mia AI' && (
									<Sparkles className={`h-3 w-3 transition-colors ${
										activeLink === item.name ? 'text-white' : 'group-hover:text-white'
									}`} />
								)}
							</button>
						)
					))}
				</div>

				{/* Right: Actions + Profile */}
				<div className="hidden lg:flex items-center gap-3">
					{/* Full navigation for non-demo users */}
					{userRole !== 'demo' && (
						<>
							<button
								className={`p-2 rounded-full border border-border dark:border-[#2a2a2a] ${
									activeLink === "Messages" ? "text-white bg-red-600" : "text-muted-foreground"
								} hover:text-foreground hover:bg-accent dark:hover:bg-accent/50 transition-colors duration-200`}
								onClick={() => router.push("/messages")}
							>
								<MessageCircleMore className="w-5 h-5" />
							</button>
							{/* Feedback Dropdown */}
							<div className="p-2 rounded-full border border-border dark:border-[#2a2a2a] text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent/50 transition-colors duration-200">
								<FeedbackDropdown />
							</div>
							<button className="p-2 rounded-full border border-border dark:border-[#2a2a2a] text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent/50 transition-colors duration-200">
								<Settings className="w-5 h-5" onClick={() => router.push("/settings")} />
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

				{/* Mobile Menu (only visible on mobile) */}
				<div className="lg:hidden flex items-center gap-4 w-full justify-between">
					<div
						className="flex items-center gap-2 cursor-pointer"
						onClick={() => userRole === 'demo' ? router.push("/mia") : router.push("/")}
					>
						<Image
							src="/motorminds-logo-white (1).svg"
							alt="Motorminds Logo"
							width={35}
							height={35}
							className="w-8 h-8 dark:invert-0 invert"
						/>
						<h1 className="text-foreground font-bold text-base m-0">MotorMinds</h1>
					</div>

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