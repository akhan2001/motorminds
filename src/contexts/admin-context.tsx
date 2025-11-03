'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'

export interface AdminContextType {
    adminType: 'super-admin' | 'organization-admin' | 'shop-admin' | null
    organizationId?: string | null
    shopId?: string | null
    loading: boolean
    error?: string | null
}

const AdminContext = createContext<AdminContextType>({
    adminType: null,
    loading: true,
    error: null
})

// Cache key for localStorage
const ADMIN_CONTEXT_CACHE_KEY = 'motorminds_admin_context'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface CachedAdminContext {
    data: AdminContextType
    timestamp: number
    userRole: string
}

export function AdminContextProvider({ children }: { children: ReactNode }) {
    const [context, setContext] = useState<AdminContextType>({
        adminType: null,
        loading: false,
        error: null
    })

    const fetchAdminContext = useCallback(async (userRole: string | null, forceRefresh = false) => {
        if (!userRole) {
            setContext({
                adminType: null,
                loading: false,
                error: null
            })
            return
        }

        const roleStr = userRole.toLowerCase()
        if (roleStr !== 'admin' && roleStr !== 'super-admin') {
            setContext({
                adminType: null,
                loading: false,
                error: null
            })
            return
        }

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(ADMIN_CONTEXT_CACHE_KEY)
                if (cached) {
                    const parsedCache: CachedAdminContext = JSON.parse(cached)
                    const isExpired = Date.now() - parsedCache.timestamp > CACHE_DURATION
                    const isSameUser = parsedCache.userRole === userRole
                    
                    if (!isExpired && isSameUser) {
                        setContext(parsedCache.data)
                        return
                    }
                }
            } catch (error) {
                console.warn('Failed to parse admin context cache:', error)
            }
        }

        // Fetch from API
        try {
            setContext(prev => ({ ...prev, loading: true, error: null }))
            
            const response = await fetch('/api/admin/context')
            
            if (!response.ok) {
                if (response.status === 403) {
                    // Not an admin - cache this result
                    const result: AdminContextType = {
                        adminType: null,
                        loading: false,
                        error: null
                    }
                    setContext(result)
                    
                    // Cache the non-admin result
                    localStorage.setItem(ADMIN_CONTEXT_CACHE_KEY, JSON.stringify({
                        data: result,
                        timestamp: Date.now(),
                        userRole
                    }))
                    return
                }
                throw new Error(`Failed to fetch admin context: ${response.status}`)
            }

            const data = await response.json()
            
            const result: AdminContextType = {
                adminType: data.adminType,
                organizationId: data.organizationId,
                shopId: data.shopId,
                loading: false,
                error: null
            }
            
            setContext(result)
            
            // Cache the result
            localStorage.setItem(ADMIN_CONTEXT_CACHE_KEY, JSON.stringify({
                data: result,
                timestamp: Date.now(),
                userRole
            }))
            
        } catch (error) {
            console.error('Error fetching admin context:', error)
            const errorResult: AdminContextType = {
                adminType: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
            setContext(errorResult)
        }
    }, []) // Empty dependency array since we don't want this function to change

    const refreshAdminContext = useCallback((userRole: string | null) => {
        fetchAdminContext(userRole, true)
    }, [fetchAdminContext])

    const clearCache = () => {
        localStorage.removeItem(ADMIN_CONTEXT_CACHE_KEY)
    }

    return (
        <AdminContext.Provider value={{
            ...context,
            // Add helper methods to context if needed
            fetchAdminContext,
            refresh: refreshAdminContext,
            clearCache
        } as any}>
            {children}
        </AdminContext.Provider>
    )
}

export const useAdminContext = () => {
    const context = useContext(AdminContext)
    if (context === undefined) {
        throw new Error('useAdminContext must be used within AdminContextProvider')
    }
    return context
}

// Hook for components that need admin context with user role integration
export const useAdminContextWithRole = (userRole: string | null) => {
    const context = useContext(AdminContext)
    const contextWithHelpers = context as any
    const hasInitialized = useRef(false)
    const lastUserRole = useRef<string | null>(null)
    
    useEffect(() => {
        // Only fetch if:
        // 1. We haven't initialized yet, OR
        // 2. The user role has actually changed
        if ((!hasInitialized.current || lastUserRole.current !== userRole) && 
            userRole !== undefined && 
            contextWithHelpers.fetchAdminContext) {
            
            contextWithHelpers.fetchAdminContext(userRole)
            hasInitialized.current = true
            lastUserRole.current = userRole
        }
    }, [userRole, contextWithHelpers.fetchAdminContext])
    
    if (context === undefined) {
        throw new Error('useAdminContextWithRole must be used within AdminContextProvider')
    }
    
    return context
}
