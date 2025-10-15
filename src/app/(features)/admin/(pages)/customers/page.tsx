'use client'

import { useState } from 'react'
import { AdminCustomerSearchBar } from '@/components/common/customers/admin-customer-search-bar'
import { Customer, CustomerVehicle } from '@/app/(features)/customers/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Car, Search, RefreshCw } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Slash } from "lucide-react"
import Link from 'next/link'
import AdminNav from '../../components/AdminNav'

export default function AdminCustomersPage() {
    const [selectedData, setSelectedData] = useState<{
        customer: Customer | null
        vehicle: CustomerVehicle | null
    }>({
        customer: null,
        vehicle: null
    })

    const handleSelection = (data: { customer: Customer; vehicle?: CustomerVehicle }) => {
        setSelectedData({
            customer: data.customer,
            vehicle: data.vehicle || null
        })
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb className="mb-6">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-gray-400 hover:text-gray-300">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Slash className="h-4 w-4" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">
                                        Customers
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Customer Search
                                </h1>
                                <p className="text-gray-400">
                                    Search across all customers in the database (all shops)
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedData({ customer: null, vehicle: null })}
                                    className="px-4 py-2 border border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] rounded-md text-sm"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2 inline" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Search Section */}
                            <div className="lg:col-span-1">
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Search className="h-5 w-5" />
                                            Customer Search
                                        </CardTitle>
                                        <CardDescription className="text-gray-400">
                                            Search all customers across all shops
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <AdminCustomerSearchBar
                                            onSelect={handleSelection}
                                            placeholder="Search all customers..."
                                            showVehicles={true}
                                            className="w-full"
                                        />

                                        <div className="mt-4 text-sm text-gray-400">
                                            <p>• Search across all shops</p>
                                            <p>• Debounced search (300ms)</p>
                                            <p>• Handles 5000+ customers</p>
                                            <p>• Vehicle selection available</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Results Section */}
                            <div className="lg:col-span-2">
                                <Card className="bg-[#111111] border-[#2a2a2a]">
                                    <CardHeader>
                                        <CardTitle className="text-white">Customer Details</CardTitle>
                                        <CardDescription className="text-gray-400">
                                            Selected customer and vehicle information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {selectedData.customer ? (
                                            <div className="space-y-6">
                                                {/* Customer Information */}
                                                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                            <Users className="h-5 w-5" />
                                                            Customer Information
                                                        </h3>
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            ID: {selectedData.customer.id.slice(0, 8)}...
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Name</label>
                                                            <p className="text-lg font-semibold text-white">
                                                                {selectedData.customer.customer_name}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Phone</label>
                                                            <p className="text-lg text-gray-300">
                                                                {selectedData.customer.customer_phone}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Email</label>
                                                            <p className="text-lg text-gray-300">
                                                                {selectedData.customer.customer_email || 'N/A'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Address</label>
                                                            <p className="text-lg text-gray-300">
                                                                {selectedData.customer.customer_address || 'N/A'}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Shop ID</label>
                                                            <p className="text-lg text-gray-300 font-mono">
                                                                {selectedData.customer.shop_id}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-400">Created</label>
                                                            <p className="text-lg text-gray-300">
                                                                {new Date(selectedData.customer.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {selectedData.customer.notes && (
                                                        <div className="mt-4">
                                                            <label className="text-sm font-medium text-gray-400">Notes</label>
                                                            <p className="text-sm text-gray-300 bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]">
                                                                {selectedData.customer.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Vehicle Information */}
                                                {selectedData.vehicle ? (
                                                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Car className="h-5 w-5 text-green-400" />
                                                            <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">Year</label>
                                                                <p className="text-lg font-semibold text-white">
                                                                    {selectedData.vehicle.year}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">Make</label>
                                                                <p className="text-lg text-gray-300">
                                                                    {selectedData.vehicle.make}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">Model</label>
                                                                <p className="text-lg text-gray-300">
                                                                    {selectedData.vehicle.model}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">License Plate</label>
                                                                <p className="text-lg text-gray-300">
                                                                    {selectedData.vehicle.license_plate || 'N/A'}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">VIN</label>
                                                                <p className="text-lg text-gray-300 font-mono">
                                                                    {selectedData.vehicle.vin || 'N/A'}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium text-gray-400">Color</label>
                                                                <p className="text-lg text-gray-300">
                                                                    {selectedData.vehicle.color || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a]">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Car className="h-5 w-5 text-gray-400" />
                                                            <h3 className="text-lg font-semibold text-gray-300">Vehicle Information</h3>
                                                        </div>
                                                        <p className="text-gray-400">
                                                            No vehicle selected or customer has no vehicles
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Raw Data (Collapsible) */}
                                                <details className="mt-6">
                                                    <summary className="cursor-pointer text-sm font-medium text-gray-300 hover:text-white">
                                                        View Raw JSON Data
                                                    </summary>
                                                    <pre className="mt-3 p-4 bg-[#1a1a1a] rounded text-xs overflow-auto border border-[#2a2a2a] text-gray-300">
                                                        {JSON.stringify(selectedData, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center">
                                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-300 mb-2">
                                                    No Customer Selected
                                                </h3>
                                                <p className="text-gray-400">
                                                    Use the search bar to find and select a customer from any shop.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
