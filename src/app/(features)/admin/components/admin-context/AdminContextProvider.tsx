'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

export function AdminContextProvider({ children }: { children: ReactNode }) {
    const [context, setContext] = useState<AdminContextType>({
        adminType: null,
        loading: true,
        error: null
    })

    useEffect(() => {
        fetchAdminContext()
    }, [])

    const fetchAdminContext = async () => {
        try {
            const response = await fetch('/api/admin/context')
            
            if (!response.ok) {
                throw new Error('Failed to fetch admin context')
            }

            const data = await response.json()
            
            setContext({
                adminType: data.adminType,
                organizationId: data.organizationId,
                shopId: data.shopId,
                loading: false,
                error: null
            })
        } catch (error) {
            console.error('Error fetching admin context:', error)
            setContext({
                adminType: null,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        }
    }

    return (
        <AdminContext.Provider value={context}>
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

