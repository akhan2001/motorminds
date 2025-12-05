'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface RouteValidationWrapperProps {
    children: ReactNode
}

/**
 * RouteValidationWrapper - Client-side middleware for route validation
 * 
 * Based on Supabase Studio's RouteValidationWrapper:
 * - Validates shop access for authenticated users
 * - Redirects if user doesn't have access to the shop
 * - Tracks navigation history (last visited shop/page)
 * - Shows toast notifications for errors
 * 
 * This runs AFTER withAuth, so we know the user is authenticated
 */
export function RouteValidationWrapper({ children }: RouteValidationWrapperProps) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    useEffect(() => {
        // Skip validation while loading or if no user
        if (loading || !user) return

        // Skip validation for public routes
        const publicPaths = ['/login', '/signup', '/auth', '/customer-intake']
        if (publicPaths.some(path => pathname?.startsWith(path))) {
            return
        }

        // Validate shop access
        validateShopAccess()
    }, [user, loading, pathname])

    async function validateShopAccess() {
        if (!user) return

        try {
            const supabase = createClient()

            // Get user's shop_id
            const { data: userData, error } = await supabase
                .from('users')
                .select('shop_id, role')
                .eq('id', user.id)
                .maybeSingle()

            if (error) {
                console.error('[RouteValidation] Error fetching user data:', error)
                return
            }

            // If user has no shop, redirect to dashboard
            if (!userData?.shop_id) {
                console.warn('[RouteValidation] User has no shop assigned')

                // Only redirect if we're on a protected route
                const protectedPaths = ['/operations', '/financials', '/admin', '/parts', '/messages']
                if (protectedPaths.some(path => pathname?.startsWith(path))) {
                    toast({
                        title: 'No shop assigned',
                        description: 'Please contact support to get access to a shop.',
                        variant: 'destructive',
                    })
                    router.push('/dashboard')
                }
                return
            }

            // Store last visited shop in localStorage for quick access
            if (typeof window !== 'undefined') {
                localStorage.setItem('last_shop_id', userData.shop_id)
                localStorage.setItem('last_visited_path', pathname || '/')
            }

            console.log('[RouteValidation] Shop access validated:', userData.shop_id)
        } catch (error) {
            console.error('[RouteValidation] Validation error:', error)
        }
    }

    return <>{children}</>
}

/**
 * Get the last visited path from localStorage
 */
export function getLastVisitedPath(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('last_visited_path')
}

/**
 * Get the last shop ID from localStorage
 */
export function getLastShopId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('last_shop_id')
}

/**
 * Clear navigation history
 */
export function clearNavigationHistory() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('last_shop_id')
    localStorage.removeItem('last_visited_path')
}

