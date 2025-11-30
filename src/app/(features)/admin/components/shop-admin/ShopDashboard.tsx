'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Package, Settings, BarChart3, Wrench } from 'lucide-react'
// import { Nav } from '@/components/navigation/nav'
import Link from 'next/link'
import AdminNav from '../AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../admin-context/useAdminContext'

interface ShopStats {
    totalUsers: number
    shopRevenue: number
    activeWorkOrders: number
    partsInventory: number
}

export function ShopDashboard() {
    const { shopId } = useAdminContext()
    const [stats, setStats] = useState<ShopStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (shopId) {
            fetchStats()
        }
    }, [shopId])

    const fetchStats = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/shop/stats')
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
            {/* <Nav /> */}
            <div className="flex-1 flex flex-col ">
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
                                        Shop Admin
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                Shop Management
                            </h1>
                            <p className="text-muted-foreground">
                                Manage your shop operations and staff
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Shop Users</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Manage shop staff and permissions
                                    </p>
                                    <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        <Link href="/admin/shop/users">
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
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Shop Performance</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        View shop analytics and reports
                                    </p>
                                    <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        <Link href="/admin/shop/performance">
                                            View Performance
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
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Shop Settings</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Configure shop-specific settings
                                    </p>
                                    <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white">
                                        <Link href="/admin/shop/settings">
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

