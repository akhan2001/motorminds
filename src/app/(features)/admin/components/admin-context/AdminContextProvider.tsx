'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface AdminContextType {
    adminType: 'super-admin' | 'organization-admin' | 'shop-admin' | null
    organizationId?: string | null
    shopId?: string | null
    loading: boolean
    error?: string | null
    refresh: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
    adminType: null,
    loading: true,
    error: null,
    refresh: async () => {}
})

export function AdminContextProvider({ children }: { children: ReactNode }) {
    const [context, setContext] = useState<AdminContextType>({
        adminType: null,
        loading: true,
        error: null
    })

    useEffect(() => {
        fetchAdminContext()
    }, [])

    const fetchAdminContext = async (skipCache = false) => {
        try {
            setContext(prev => ({ ...prev, loading: true, error: null }))
            
            const url = skipCache ? '/api/admin/context?debug=true&clearCache=true' : '/api/admin/context'
            const response = await fetch(url)
            
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch admin context')
            }

            const data = await response.json()
            
            console.log('Admin context fetched:', data)
            
            setContext({
                adminType: data.adminType,
                organizationId: data.organizationId,
                shopId: data.shopId,
                loading: false,
                error: null,
                refresh: () => fetchAdminContext(true)
            })
        } catch (error) {
            console.error('Error fetching admin context:', error)
            setContext({
                adminType: null,
                organizationId: null,
                shopId: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                refresh: () => fetchAdminContext(true)
            })
        }
    }

    return (
        <AdminContext.Provider value={{
            ...context,
            refresh: () => fetchAdminContext(true)
        }}>
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

