"use client"

import { createClient } from "@/utils/supabase/client"
import { Settings, ChevronDown, MessageCircle, Sparkles } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { MobileNav } from "./mobile-nav"
import { useQueryClient } from '@tanstack/react-query'
import { useUserRole } from "@/hooks/core/useUserRole"
import { useShopInfo } from "@/hooks/core/useShopInfo"
import { getFilteredNavItems } from "@/lib/utils/navigation"
import { ProfileDropdown } from "@/components/layout/nav/profile-dropdown"
import { FeedbackDropdown } from "@/components/layout/header/FeedbackDropdown/FeedbackDropdown"

export function Nav() {
	const router = useRouter()
	const pathname = usePathname()
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const { data: userRole, isLoading: isLoadingRole } = useUserRole()
	const { data: shopInfo, isLoading: isLoadingShop } = useShopInfo()

	if (!pathname) {
		return null
	}

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true)
	}, [])

	// Avatar is now handled by the ProfileDropdown component

	// Render the icon based on mounted state to avoid hydration mismatch
	const themeIcon = mounted && theme === "light" ? (
		<Moon className="w-4 h-4 mr-2" />
	) : (
		<Sun className="w-4 h-4 mr-2" />
	)

	const themeText = mounted && theme === "light" ? "Dark Mode" : "Light Mode"

	// Get filtered navigation items based on user role
	const navItems = useMemo(() => {
		return getFilteredNavItems(userRole ?? null);
	}, [userRole]);

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
			<header className="bg-[#0d0d0d] px-4 pt-2 border-b border-[#1f1f1f] z-50 sticky top-0 bg-opacity-90 backdrop-blur-sm">
				<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
					<div className="flex items-center gap-4 py-3">
						<div className="flex items-center gap-2">
							<Image
								src="/motorminds-logo-white (1).svg"
								alt="Motorminds Logo"
								width={35}
								height={35}
								className="w-8 h-8"
							/>
							<span className="text-white font-medium">Motorminds</span>
						</div>
						<div className="text-[#979797] text-sm">Loading...</div>
					</div>
				</nav>
			</header>
		);
	}

	return (
		<header className="bg-[#0d0d0d] px-4 pt-2 border-b border-[#1f1f1f] z-50 sticky top-0 bg-opacity-90 backdrop-blur-sm">
			<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
				<div className="flex flex-col items-start">
					{/* Left: Logo and Premium Badge */}
					<div className="flex items-center gap-4 py-3">
						<div 
						className="flex items-center gap-2 cursor-pointer hover:bg-[#1f1f1f] px-2 py-1 rounded-md transition-opacity"
						onClick={() => userRole === 'demo' ? router.push("/mia") : router.push("/")}
						>
							<Image
							src="/motorminds-logo-white (1).svg"
							alt="Motorminds Logo"
							width={35}
							height={35}
							className="w-8 h-8"
							/>
							<span className="text-white font-medium">Motorminds</span>
						</div>
						<div className="hidden lg:block">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="outline" className="cursor-default text-white border-[#979797]">
										{userRole === 'demo' ? 'Demo' : userRole === 'admin' ? 'Admin' : userRole === 'super' ? 'Super' : 'Premium'}
									</Badge>
								</TooltipTrigger>
								<TooltipContent className="bg-[#1f1f1f] text-white border-none">
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
													: "text-[#979797] border-transparent hover:text-white hover:border-[#979797] transition-colors"
												}`}
											>
												{item.name}
												<ChevronDown className="h-4 w-4" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-[#0d0d0d] text-white border-[#1f1f1f] min-w-[180px]">
											{item.subItems?.map((subItem) => (
												<DropdownMenuItem 
													key={subItem.name}
													onClick={() => handleSubItemClick(item.name, subItem.href)}
													className="cursor-pointer hover:bg-[#1f1f1f] hover:text-white"
												>
													{subItem.name}
												</DropdownMenuItem>
											))}
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
										: "text-[#979797] border-transparent hover:border-red-500 transition-colors"
									} ${item.name === 'Mia AI' ? 'text-white hover:text-red-500 hover:animate-pulse' : 'hover:text-white'}`}
								>
									{item.name}
									{item.name === 'Mia AI' && (
										<Sparkles className="h-3 w-3 text-white transition-colors group-hover:text-red-500" />
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
									activeLink === "Messages" ? "text-white" : "text-[#979797]"
								} hover:text-white transition-colors`} 
								onClick={() => router.push("/messages")}
							>
								<MessageCircle className="inline-block w-5 h-5" />
							</button>
							{/* Feedback Dropdown */}
							<FeedbackDropdown />
							<button className="text-[#979797] hover:text-white transition-colors">
								<Settings className="inline-block w-5 h-5" onClick={() => router.push("/settings")} />
							</button>
						</>
					)}
					
					{/* MIA Diagnostics Button - shown only on /operations */}
					{pathname === '/operations' && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<button 
										className="opacity-70 hover:opacity-100 transition-opacity relative"
										onClick={() => {
											// Dispatch custom event to toggle AI panel
											window.dispatchEvent(new CustomEvent('toggle-ai-panel'))
										}}
										aria-label="Toggle AI Assistant Panel"
									>
										<Image
											src="/red-motorminds-logo-svg.svg"
											alt="AI Assistant"
											width={24}
											height={24}
											className="w-6 h-6"
										/>
									</button>
								</TooltipTrigger>
								<TooltipContent className="bg-[#1f1f1f] text-white border-none">
									<p className="text-xs">Toggle AI Assistant</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
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