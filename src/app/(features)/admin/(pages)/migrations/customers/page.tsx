'use client'

import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import { Database, Users } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminNav from '../../../components/AdminNav'
import MigrationsNav from '../../../components/migrations/MigrationsNav'
import FileUploadComponent from '../../../components/file-upload'

export default function CustomerMigrationsPage() {
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
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin/migrations" className="text-gray-400 hover:text-white">
                                            Migrations
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Database className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">Customer Migrations</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Customer Migrations
                            </h1>
                            <p className="text-gray-400">
                                Manage customer data migrations and verify staging tables
                            </p>
                        </div>

                        {/* Migrations Navigation */}
                        <MigrationsNav />

                        <FileUploadComponent 
                            selectedFile={null}
                            analyzing={false}
                            onFileSelect={() => {}}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}