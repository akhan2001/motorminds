'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Database,
    CheckCircle,
    AlertTriangle
} from 'lucide-react'
import { Nav } from '@/components/navigation/nav'
import Link from 'next/link'
import AdminNav from '../../components/AdminNav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { BreadcrumbPage } from '@/components/ui/breadcrumb'
import { StagingVerificationComponent } from '../../components/staging-verification'
import MigrationsNav from '../../components/migrations/MigrationsNav'

export default function MigrationsPage() {
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
                                    <Database className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">Migrations</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Database Migrations
                            </h1>
                            <p className="text-gray-400">
                                Manage database migrations and verify staging tables
                            </p>
                        </div>

                        {/* Migrations Navigation */}
                        <MigrationsNav />

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Staging Tables</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-blue-600/20 rounded-full">
                                            <Database className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-400">No data available</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Verifications</p>
                                            <p className="text-2xl font-bold text-white">0</p>
                                        </div>
                                        <div className="p-3 bg-green-600/20 rounded-full">
                                            <CheckCircle className="h-6 w-6 text-green-400" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-400">No data available</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Health Status</p>
                                            <p className="text-2xl font-bold text-white">Unknown</p>
                                        </div>
                                        <div className="p-3 bg-yellow-600/20 rounded-full">
                                            <AlertTriangle className="h-6 w-6 text-yellow-400" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="text-gray-400">No data available</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Staging Verification Component */}
                        <StagingVerificationComponent />
                    </div>
                </div>
            </div>
        </div>
    )
}
