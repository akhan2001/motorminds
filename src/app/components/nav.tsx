"use client"

import { createClient } from "@/utils/supabase/client"
import { Settings, HelpCircle, ChevronDown, MessageCircle } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { getShopInfo } from "@/utils/shopinfo/getShopInfo"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { MobileNav } from "./mobile-nav"
import { useUserRole } from "@/hooks/core/useUserRole"
import { getFilteredNavItems } from "@/lib/utils/navigation"

export function Nav() {
	const router = useRouter()
	const pathname = usePathname()
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)
	const [avatar, setAvatar] = useState("")
	const [open, setOpen] = useState(false)
	const { data: userRole, isLoading: isLoadingRole } = useUserRole()

	if (!pathname) {
		return null
	}

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		const fetchShopInfo = async () => {
			const user = await checkUser()
			if (user) {
				const shopId = await getShopId(user.id)
				if (shopId) {
					const shopInfo = await getShopInfo(shopId)
					setAvatar(shopInfo[0].logo_image_url)
				}
			}
		}
		fetchShopInfo()
	}, [])

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
				router.push("/login")
				router.refresh()
			}
		} catch (error) {
			console.error("Logout error:", error)
		}
	}

	// Show loading state while fetching role
	if (isLoadingRole) {
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
									className={`py-2 border-b-2 ${
										activeLink === item.name
										? "text-[#b22222] border-[#b22222]"
										: "text-[#979797] border-transparent hover:text-white hover:border-[#979797] transition-colors"
									}`}
								>
									{item.name}
									{item.name === "Mia AI" &&
									<Badge variant="outline" className="text-xs mx-2 px-2 py-0.5 text-[#979797] border-[#979797]">Beta</Badge>
									}
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
							<button className="text-[#979797] hover:text-white transition-colors">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<HelpCircle className="inline-block w-5 h-5" />
									</AlertDialogTrigger>
									<AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
										<AlertDialogHeader>
											<AlertDialogTitle>You Are About to Leave the App</AlertDialogTitle>
											<AlertDialogDescription>
												You are about to open an external contact page. Do you want to continue?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel className="">Cancel</AlertDialogCancel>
											<AlertDialogAction className="border-none bg-red-600 text-white hover:bg-red-700" onClick={() => window.open("https://www.motorminds.ca/contact-us", "_blank")}>
												Yes, Continue
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</button>
							<button className="text-[#979797] hover:text-white transition-colors">
								<Settings className="inline-block w-5 h-5" onClick={() => router.push("/settings")} />
							</button>
						</>
					)}
					
					{/* Avatar with logout - shown for all users */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Avatar className="w-7 h-7 cursor-pointer">
								<AvatarImage src={avatar} />
								<AvatarFallback>AK</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
							<AlertDialog>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<LogOut className="w-4 h-4 mr-2" />
									Logout
								</DropdownMenuItem>
							</AlertDialogTrigger>
								<AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
									<AlertDialogHeader>
										<AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
										<AlertDialogDescription>
											You are about to logout. Do you want to continue?
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel className="">Cancel</AlertDialogCancel>
										<AlertDialogAction
											className="border-none bg-red-600 text-white hover:bg-red-700"
											onClick={() => { handleLogout() }}
										>
											Yes, Continue
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				{/* Right: Mobile Menu (only visible on mobile) */}
				<div className="lg:hidden">
					{userRole === 'demo' ? (
						/* Simplified mobile menu for demo users - just avatar with logout */
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Avatar className="w-8 h-8 cursor-pointer">
									<AvatarImage src={avatar} />
									<AvatarFallback>AK</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
											<LogOut className="w-4 h-4 mr-2" />
											Logout
										</DropdownMenuItem>
									</AlertDialogTrigger>
									<AlertDialogContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
										<AlertDialogHeader>
											<AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
											<AlertDialogDescription>
												You are about to logout. Do you want to continue?
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel className="">Cancel</AlertDialogCancel>
											<AlertDialogAction
												className="border-none bg-red-600 text-white hover:bg-red-700"
												onClick={() => { handleLogout() }}
											>
												Yes, Continue
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						/* Full mobile navigation for non-demo users */
						<MobileNav 
							navItems={navItems}
							activeLink={activeLink}
							avatar={avatar}
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