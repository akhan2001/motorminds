'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CustomerIntakeForm from './components/customer-intake-form'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export default function CustomerIntakePage() {
    const [mounted, setMounted] = useState(false)
    const [shopId, setShopId] = useState<string>('')
    const [shopName, setShopName] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const { theme, setTheme } = useTheme()
    const searchParams = useSearchParams()

    useEffect(() => {
        async function initializeShopId() {
            setMounted(true)
            
            // First, try to get shopId from URL params
            const shopIdParam = searchParams?.get('shop')
            
            if (shopIdParam) {
                setShopId(shopIdParam)
                
                // Fetch shop name
                try {
                    const { data: shopData } = await supabase
                        .from('shops')
                        .select('shop_name')
                        .eq('id', shopIdParam)
                        .single()
                    
                    if (shopData?.shop_name) {
                        setShopName(shopData.shop_name)
                    }
                } catch (error) {
                    console.error('Error fetching shop name:', error)
                }
                
                setIsLoading(false)
                return
            }

            // If no URL param, try to get from authenticated user session
            try {
                const { data: { user } } = await supabase.auth.getUser()
                
                if (user) {
                    // Try to get shop_id from user metadata
                    let userShopId = user.user_metadata?.shop_id
                    
                    // If not in metadata, query the users table
                    if (!userShopId) {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('shop_id')
                            .eq('id', user.id)
                            .single()
                        
                        if (userData?.shop_id) {
                            userShopId = userData.shop_id
                        }
                    }
                    
                    if (userShopId) {
                        setShopId(userShopId)
                        
                        // Fetch shop name
                        try {
                            const { data: shopData } = await supabase
                                .from('shops')
                                .select('shop_name')
                                .eq('id', userShopId)
                                .single()
                            
                            if (shopData?.shop_name) {
                                setShopName(shopData.shop_name)
                            }
                        } catch (error) {
                            console.error('Error fetching shop name:', error)
                        }
                        
                        setIsLoading(false)
                        return
                    }
                }
            } catch (error) {
                console.error('Error fetching shop ID:', error)
            }

            // If still no shop ID, try environment variable as last resort
            const defaultShopId = process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID || ''
            setShopId(defaultShopId)
            
            if (defaultShopId) {
                // Try to fetch shop name for default shop ID
                try {
                    const { data: shopData } = await supabase
                        .from('shops')
                        .select('shop_name')
                        .eq('id', defaultShopId)
                        .single()
                    
                    if (shopData?.shop_name) {
                        setShopName(shopData.shop_name)
                    }
                } catch (error) {
                    console.error('Error fetching shop name:', error)
                }
            }
            
            setIsLoading(false)
        }

        initializeShopId()
    }, [searchParams])

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    // Show loading state
    if (!mounted || isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <div className="flex justify-center items-center h-screen">
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        )
    }

    // Show error if no shop ID after mount
    if (!shopId || shopId === '') {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <header className="bg-card border-b border-border py-4">
                    <div className="container mx-auto px-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/motorminds-logo-white (1).svg"
                                alt="MotorMinds Logo"
                                width={35}
                                height={35}
                                className="w-8 h-8 dark:invert-0 invert"
                            />
                            <span className="text-foreground font-medium text-lg">MotorMinds</span>
                        </div>
                    </div>
                </header>
                <div className="flex justify-center items-center flex-1">
                    <div className="text-center max-w-lg p-6">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 dark:text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Shop Link Required</h2>
                            <p className="text-muted-foreground mb-6">
                                This form needs to be accessed through your shop's unique link.
                            </p>
                            
                            <div className="bg-muted rounded-lg p-4 mb-4">
                                <p className="text-sm text-foreground font-medium mb-2">For Customers:</p>
                                <p className="text-sm text-muted-foreground">
                                    Please ask your shop for the correct link, or scan the QR code at their front desk.
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">For Shop Staff:</p>
                                <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
                                    Your customer intake link should look like:
                                </p>
                                <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded block overflow-x-auto">
                                    /customer-intake?shop=YOUR-SHOP-ID
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header with logo and theme toggle */}
            <header className="bg-card border-b border-border py-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/motorminds-logo-white (1).svg"
                            alt="MotorMinds Logo"
                            width={35}
                            height={35}
                            className="w-8 h-8 dark:invert-0 invert"
                        />
                        <div className="flex flex-col">
                            <span className="text-foreground font-medium text-lg">MotorMinds</span>
                            {shopName && (
                                <span className="text-sm text-muted-foreground">{shopName}</span>
                            )}
                        </div>
                    </div>

                    {/* Theme Toggle Button */}
                    {mounted && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto py-8 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-foreground">Customer Information Form</h1>
                    <p className="text-muted-foreground">Please fill out your details below to get started</p>
                </div>
                <CustomerIntakeForm shopId={shopId} user={null} />
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-6">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground text-sm">
                        &copy; {new Date().getFullYear()} MotorMinds. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
