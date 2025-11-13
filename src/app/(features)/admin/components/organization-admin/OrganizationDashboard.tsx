'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, TrendingUp, Package, Settings, BarChart3 } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../admin-context/useAdminContext'

interface OrganizationStats {
    totalShops: number
    totalUsers: number
    organizationRevenue: number
    activeWorkOrders: number
}

export function OrganizationDashboard() {
    const { organizationId } = useAdminContext()
    const [stats, setStats] = useState<OrganizationStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (organizationId) {
            fetchStats()
        }
    }, [organizationId])

    const fetchStats = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/organization/stats')
            const data = await response.json()
            
            if (response.ok) {
                setStats(data.stats)
            } else {
                console.error('Error fetching stats:', data.error)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-muted-foreground" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-foreground">
                                        Organization Admin
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                Organization Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your MSO shops and resources
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Shops</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {loading ? '...' : stats?.totalShops || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {loading ? '...' : stats?.totalUsers || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Organization Revenue</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {loading ? '...' : formatCurrency(stats?.organizationRevenue || 0)}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                                            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Active Work Orders</p>
                                            <p className="text-2xl font-bold text-foreground">
                                                {loading ? '...' : stats?.activeWorkOrders || 0}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                                            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Shops</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Manage all shops in your organization
                                    </p>
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        <Link href="/admin/organization/shops">
                                            Manage Shops
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Users</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Cross-shop user management
                                    </p>
                                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                        <Link href="/admin/organization/users">
                                            Manage Users
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                            <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Analytics</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Organization-wide analytics
                                    </p>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                                        <Link href="/admin/shared/analytics">
                                            View Analytics
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Shared Resources</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Parts catalog, pricing, procedures
                                    </p>
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                        <Link href="/admin/organization/resources">
                                            Manage Resources
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Organization Settings</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Configure organization settings
                                    </p>
                                    <Button asChild className="w-full bg-gray-600 hover:bg-gray-700 text-white">
                                        <Link href="/admin/organization/settings">
                                            Settings
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

