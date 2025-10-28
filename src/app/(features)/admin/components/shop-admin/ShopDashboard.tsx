'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Package, Settings, BarChart3, Wrench } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'
import { useAdminContext } from '../admin-context/useAdminContext'

export function ShopDashboard() {
    const { shopId } = useAdminContext()

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-gray-400 hover:text-white">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Shop Admin
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Shop Management
                            </h1>
                            <p className="text-gray-400">
                                Manage your shop operations and staff
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Shop Users</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-purple-600/20 rounded-full">
                                            <Users className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Shop Revenue</p>
                                            <p className="text-2xl font-bold text-white">$0</p>
                                        </div>
                                        <div className="p-3 bg-green-600/20 rounded-full">
                                            <TrendingUp className="h-6 w-6 text-green-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Active Work Orders</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-orange-600/20 rounded-full">
                                            <Wrench className="h-6 w-6 text-orange-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Parts Inventory</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-blue-600/20 rounded-full">
                                            <Package className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-600/20 rounded-lg">
                                            <Users className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Shop Users</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Manage shop staff and permissions
                                    </p>
                                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                        <Link href="/admin/shop/users">
                                            Manage Users
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-green-600/20 rounded-lg">
                                            <BarChart3 className="h-6 w-6 text-green-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Shop Performance</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        View shop analytics and reports
                                    </p>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                                        <Link href="/admin/shop/performance">
                                            View Performance
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-gray-600/20 rounded-lg">
                                            <Settings className="h-6 w-6 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Shop Settings</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Configure shop-specific settings
                                    </p>
                                    <Button asChild className="w-full bg-gray-600 hover:bg-gray-700">
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

