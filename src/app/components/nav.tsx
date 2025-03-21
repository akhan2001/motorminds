"use client"

import { supabase } from "@/lib/supabase"
import { Bell, Settings, HelpCircle, MoreHorizontal, Link } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function Nav(
	props: {
		activeLink: string
	}
) {
	const router = useRouter()
	const [activeLink, setActiveLink] = useState(props.activeLink) // Default active link
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true)
	}, [])

	// Render the icon based on mounted state to avoid hydration mismatch
	const themeIcon = mounted && theme === "light" ? (
		<Moon className="w-4 h-4 mr-2" />
	) : (
		<Sun className="w-4 h-4 mr-2" />
	)

	const themeText = mounted && theme === "light" ? "Dark Mode" : "Light Mode"

	const navItems = [
		{ name: "Dashboard", href: "/" },
		{ name: "Mechanic Hub", href: "/mechanic-hub" },
		// { name: "Tasks", href: "/tasks" },
		{ name: "Mia AI", href: "/chat" },
		{ name: "Invoices", href: "/invoices" },
		{ name: "Lead Generation", href: "/lead-generation" },
		{ name: "Loyalty", href: "/loyalty" },
		{ name: "Customers", href: "/customers" },
	]

	const handleNavClick = (name: string, href: string) => {
		setActiveLink(name)
		router.push(href)
	}

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error("Logout error:", error)
		}
		router.push("/login")
		window.location.reload()
	}

	// useEffect(() => {
	// 	// console.log("Current theme:", theme);
	// }, [theme]);

	return (
		<header className="bg-[#0d0d0d] px-4 pt-2 border-b border-[#1f1f1f] z-50 sticky top-0 bg-opacity-90 backdrop-blur-sm">
			<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
				<div className="flex flex-col items-start">
					{/* Left: Logo and Premium Badge */}
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
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="outline" className="cursor-default">Premium</Badge>
								</TooltipTrigger>
								<TooltipContent className="bg-[#1f1f1f] text-white border-none">
									<p className="text-xs text-[#FBBC05]">You are a premium user</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					{/* Center: Navigation Links */}
					<div className="hidden lg:flex items-center gap-8">
					{navItems.map((item) => (
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
					))}
					</div>
				</div>
				{/* Right: Actions */}
				<div className="flex items-center gap-4">
				<button className="text-[#979797] hover:text-white transition-colors">
					{/* <span className="hidden md:inline mr-2">Help</span> */}
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
				{/* <button className="text-[#979797] hover:text-white transition-colors relative">
					<Bell className="w-5 h-5" />
					<span className="absolute -top-1 -right-1 w-2 h-2 bg-[#b22222] rounded-full" />
				</button> */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
							<Avatar className="w-7 h-7 cursor-pointer">
								<AvatarImage src="https://github.com/shadcn.png" />
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
						{/* <DropdownMenuItem
							onSelect={(e) => {
								e.preventDefault();
								setTheme(theme === "light" ? "dark" : "light");
							}}
						>
							{themeIcon}
							{themeText}
						</DropdownMenuItem> */}
					</DropdownMenuContent>
				</DropdownMenu>
				</div>
			</nav>
		</header>
	)
}

