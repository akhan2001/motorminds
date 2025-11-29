'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Users, Building2 } from 'lucide-react'
// import { Nav } from '@/components/navigation/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import AdminNav from '../../components/AdminNav'
import { AdminStatementGenerator } from '../../components/AdminStatementGenerator'

export default function AdminCustomerStatementsPage() {
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            {/* <Nav /> */}
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
                                        Customer Statements
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Customer Statements
                            </h1>
                            <p className="text-gray-400">
                                Generate account statements for customers across all shops
                            </p>
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Info Cards */}
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Statement Type</p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                Customer Account
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-600/20 rounded-full">
                                            <FileText className="h-6 w-6 text-blue-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Bank-ready account statements with transaction history
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Access Level</p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                All Shops
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-600/20 rounded-full">
                                            <Building2 className="h-6 w-6 text-green-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Generate statements for customers from any shop
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Bulk Operations</p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                Enabled
                                            </p>
                                        </div>
                                        <div className="p-3 bg-purple-600/20 rounded-full">
                                            <Users className="h-6 w-6 text-purple-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Generate statements for multiple customers at once
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Action Card */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white">Generate Statements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-400 text-sm">
                                    Select customers from one or multiple shops and generate professional account statements
                                    for bank purposes. Statements include:
                                </p>
                                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 ml-2">
                                    <li>Complete transaction history with running balances</li>
                                    <li>Invoice details including vehicle information and notes</li>
                                    <li>Previous balance, new charges, and current balance due</li>
                                    <li>Professional formatting suitable for bank submission</li>
                                    <li>Customizable date ranges (30/90 days, 6/12 months, custom)</li>
                                </ul>
                                
                                <div className="pt-4">
                                    <Button
                                        onClick={() => setIsGeneratorOpen(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        size="lg"
                                    >
                                        <FileText className="mr-2 h-5 w-5" />
                                        Generate Customer Statements
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features Card */}
                        <Card className="bg-[#111111] border-[#2a2a2a] mt-6">
                            <CardHeader>
                                <CardTitle className="text-white">Features</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-white">Shop Selection</h4>
                                        <p className="text-xs text-gray-400">
                                            Choose to generate statements for customers from a specific shop or across all shops
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-white">Customer Search</h4>
                                        <p className="text-xs text-gray-400">
                                            Search and filter customers by name, email, phone, or shop name
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-white">Flexible Date Ranges</h4>
                                        <p className="text-xs text-gray-400">
                                            Use preset ranges (30/90 days, 6/12 months, YTD) or set custom date ranges
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-white">Bulk Generation</h4>
                                        <p className="text-xs text-gray-400">
                                            Select multiple customers and generate all their statements in one operation
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Statement Generator Dialog */}
            <AdminStatementGenerator
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
            />
        </div>
    )
}
