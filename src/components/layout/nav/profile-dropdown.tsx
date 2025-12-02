"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { LogOut, Settings, HelpCircle, Shield, Moon, Sun } from "lucide-react"
import { createClient, resetClient } from "@/utils/supabase/client"
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

interface ProfileDropdownProps {
    avatar: string
    shopOwnerName?: string
    shopName?: string
    userRole?: string
}

export function ProfileDropdown({ avatar, shopOwnerName, shopName, userRole }: ProfileDropdownProps) {
    const [mounted, setMounted] = useState(false)
    const queryClient = useQueryClient()
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Theme toggle helpers
    const themeIcon = mounted && theme === "light" ? (
        <Moon className="w-4 h-4 mr-3" />
    ) : (
        <Sun className="w-4 h-4 mr-3" />
    )
    const themeText = mounted && theme === "light" ? "Dark Mode" : "Light Mode"

    // Generate initials from shop owner name
    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map(word => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const handleLogout = async () => {
        try {
            console.log('Starting logout...')

            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SignOut timeout')), 3000)
            )

            const supabase = createClient()
            console.log('Calling supabase.auth.signOut()...')

            // Race between signOut and timeout
            try {
                await Promise.race([
                    supabase.auth.signOut(),
                    timeout
                ])
                console.log('Sign out successful')
            } catch (timeoutError) {
                console.warn('SignOut timed out, proceeding with cleanup anyway:', timeoutError)
            }

            console.log('Clearing caches...')

            // Clear all caches
            queryClient.clear()
            console.log('React Query cache cleared')

            localStorage.clear() // Clear localStorage cache (admin context, etc.)
            console.log('localStorage cleared')

            // Reset the singleton Supabase client
            resetClient()
            console.log('Supabase client reset')

            // Force a full page reload to clear all cached data
            console.log('Redirecting to /login...')
            window.location.href = "/login"
        } catch (error) {
            console.error("Unexpected logout error:", error)
            // Still try to redirect even on error
            localStorage.clear()
            resetClient()
            window.location.href = "/login"
        }
    }

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'settings':
        router.push('/settings')
        break
      case 'support':
        window.open("https://www.motorminds.ca/contact-us", "_blank")
        break
      default:
        break
    }
  }

    if (!mounted) {
        return (
            <Avatar className="w-7 h-7 cursor-pointer">
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="w-7 h-7 cursor-pointer">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{getInitials(shopOwnerName)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover dark:bg-[#0d0d0d] text-popover-foreground dark:text-white border-border dark:border-[#1f1f1f] min-w-[280px] p-0">
                {/* Shop Info Header */}
                <div className="px-4 py-3 border-b border-border dark:border-[#1f1f1f]">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={avatar} />
                            <AvatarFallback>{getInitials(shopOwnerName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground dark:text-white truncate">
                                {shopOwnerName || "Shop Owner"}
                            </p>
                            <p className="text-xs text-muted-foreground dark:text-[#979797] truncate">
                                {shopName || "Auto Shop"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3 text-[#FBBC05]" />
                                <span className="text-xs text-[#FBBC05]">
                                    {userRole === 'demo' ? 'Demo' : userRole === 'admin' ? 'Admin' : userRole === 'super' ? 'Super' : 'Premium'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

        {/* Menu Items */}
        <div className="py-2">
          <DropdownMenuItem 
            onClick={() => handleMenuClick('settings')}
            className="cursor-pointer hover:bg-accent dark:hover:bg-[#1f1f1f] hover:text-accent-foreground dark:hover:text-white px-4 py-2"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleMenuClick('support')}
            className="cursor-pointer hover:bg-accent dark:hover:bg-[#1f1f1f] hover:text-accent-foreground dark:hover:text-white px-4 py-2"
          >
            <HelpCircle className="w-4 h-4 mr-3" />
            Support
          </DropdownMenuItem>

          {/* Theme Toggle */}
          <DropdownMenuItem 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="cursor-pointer hover:bg-accent dark:hover:bg-[#1f1f1f] hover:text-accent-foreground dark:hover:text-white px-4 py-2"
            disabled={!mounted}
          >
            {themeIcon}
            {themeText}
          </DropdownMenuItem>
        </div>

                <DropdownMenuSeparator className="bg-border dark:bg-[#1f1f1f]" />

                {/* Logout */}
                <div className="py-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer hover:bg-accent dark:hover:bg-[#1f1f1f] hover:text-accent-foreground dark:hover:text-white px-4 py-2 text-red-500 dark:text-red-400">
                                <LogOut className="w-4 h-4 mr-3" />
                                Log out
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover dark:bg-[#0d0d0d] text-popover-foreground dark:text-white border-border dark:border-[#1f1f1f]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground dark:text-gray-400">
                                    You are about to logout. Do you want to continue?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-secondary dark:bg-transparent">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="border-none bg-red-600 text-white hover:bg-red-700"
                                    onClick={handleLogout}
                                >
                                    Yes, Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
