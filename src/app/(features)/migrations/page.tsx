'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Users, Car, FileText } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { BreadcrumbPage } from '@/components/ui/breadcrumb'
import { useMigrationsData } from './hooks/use-migrations-data'
import MigrationsSummary from './components/migrations-summary'
import StagingCustomersTable from './components/staging-customers-table'
import StagingVehiclesTable from './components/staging-vehicles-table'
import StagingInvoicesTable from './components/staging-invoices-table'

export default function MigrationsPage() {
    const [activeTab, setActiveTab] = useState('summary')
    const { summary, summaryLoading } = useMigrationsData()

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
                                    <BreadcrumbLink href="/" className="text-gray-400 hover:text-white">
                                        Home
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

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Data Migrations</h1>
                            <p className="text-gray-400">
                                Review and manage staging data for customers, vehicles, and invoices
                            </p>
                        </div>

                        {/* Summary Cards */}
                        <MigrationsSummary summary={summary} loading={summaryLoading} />

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-[#111111] border-[#2a2a2a]">
                                <TabsTrigger 
                                    value="summary" 
                                    className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-400"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Summary
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="customers" 
                                    className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-400"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Customers
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="vehicles" 
                                    className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-400"
                                >
                                    <Car className="h-4 w-4 mr-2" />
                                    Vehicles
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="invoices" 
                                    className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-gray-400"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Invoices
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="summary" className="mt-6">
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <Database className="h-5 w-5 mr-2" />
                                            Migration Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-6 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                                <h3 className="text-lg font-semibold text-white mb-1">Customers</h3>
                                                <p className="text-2xl font-bold text-blue-400">
                                                    {summary?.customers.total || 0}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {summary?.customers.matched || 0} matched
                                                </p>
                                            </div>
                                            <div className="text-center p-6 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                                <Car className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                                <h3 className="text-lg font-semibold text-white mb-1">Vehicles</h3>
                                                <p className="text-2xl font-bold text-green-400">
                                                    {summary?.vehicles.total || 0}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {summary?.vehicles.matched || 0} matched
                                                </p>
                                            </div>
                                            <div className="text-center p-6 bg-[#0d0d0d] rounded-lg border border-[#2a2a2a]">
                                                <FileText className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                                <h3 className="text-lg font-semibold text-white mb-1">Invoices</h3>
                                                <p className="text-2xl font-bold text-purple-400">
                                                    {summary?.invoices.total || 0}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {summary?.invoices.matched || 0} matched
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="customers" className="mt-6">
                                <StagingCustomersTable />
                            </TabsContent>

                            <TabsContent value="vehicles" className="mt-6">
                                <StagingVehiclesTable />
                            </TabsContent>

                            <TabsContent value="invoices" className="mt-6">
                                <StagingInvoicesTable />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
