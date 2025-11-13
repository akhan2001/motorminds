'use client'

import { useAdminContext } from '@/contexts/admin-context'
import { SuperAdminDashboard } from './super-admin/SuperAdminDashboard'
import { OrganizationDashboard } from './organization-admin/OrganizationDashboard'
import { ShopDashboard } from './shop-admin/ShopDashboard'
import { Loader2 } from 'lucide-react'

export function AdminRouter() {
    const { adminType, loading, error } = useAdminContext()

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading admin interface...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Error loading admin context</p>
                    <p className="text-muted-foreground text-sm">{error}</p>
                </div>
            </div>
        )
    }

    if (!adminType) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-red-500 mb-2">Access Denied</p>
                    <p className="text-muted-foreground text-sm">You do not have admin privileges</p>
                </div>
            </div>
        )
    }

    switch (adminType) {
        case 'super-admin':
            return <SuperAdminDashboard />
        case 'organization-admin':
            return <OrganizationDashboard />
        case 'shop-admin':
            return <ShopDashboard />
        default:
            return (
                <div className="h-screen flex items-center justify-center bg-background">
                    <div className="text-center">
                        <p className="text-red-500 mb-2">Unknown Admin Type</p>
                        <p className="text-muted-foreground text-sm">Invalid admin configuration</p>
                    </div>
                </div>
            )
    }
}

