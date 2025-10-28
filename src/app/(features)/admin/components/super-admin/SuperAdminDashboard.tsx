'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, TrendingUp, Database, Settings, BarChart3 } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import AdminNav from '../AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Slash } from 'lucide-react'

export function SuperAdminDashboard() {
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
                                        Platform Admin
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                MotorMinds Platform Admin
                            </h1>
                            <p className="text-gray-400">
                                Manage the entire MotorMinds platform
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Total Organizations</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-blue-600/20 rounded-full">
                                            <Building2 className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Total Shops</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-green-600/20 rounded-full">
                                            <Building2 className="h-6 w-6 text-green-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Total Users</p>
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
                                            <p className="text-sm font-medium text-gray-400">Platform Revenue</p>
                                            <p className="text-2xl font-bold text-white">$0</p>
                                        </div>
                                        <div className="p-3 bg-green-600/20 rounded-full">
                                            <TrendingUp className="h-6 w-6 text-green-400" />
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
                                        <div className="p-3 bg-blue-600/20 rounded-lg">
                                            <Building2 className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Organizations</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Manage all MSOs and organizations
                                    </p>
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Link href="/admin/super-admin/organizations">
                                            Manage Organizations
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-600/20 rounded-lg">
                                            <Users className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Users</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Platform-wide user management
                                    </p>
                                    <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                        <Link href="/admin/users">
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
                                    <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Platform-wide analytics and reports
                                    </p>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                                        <Link href="/admin/super-admin/platform/analytics">
                                            View Analytics
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-orange-600/20 rounded-lg">
                                            <Database className="h-6 w-6 text-orange-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">System Health</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Monitor platform health and logs
                                    </p>
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                                        <Link href="/admin/super-admin/system">
                                            System Status
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
                                    <h3 className="text-lg font-semibold text-white mb-2">Platform Settings</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Configure platform-wide settings
                                    </p>
                                    <Button asChild className="w-full bg-gray-600 hover:bg-gray-700">
                                        <Link href="/admin/settings">
                                            Settings
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-600/20 rounded-lg">
                                            <Database className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Data Migrations</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Manage data imports and migrations
                                    </p>
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Link href="/admin/migrations">
                                            Migrations
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

