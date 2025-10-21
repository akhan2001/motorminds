'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Database, FileText } from 'lucide-react'
import { Nav } from '@/app/components/nav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { BreadcrumbPage } from '@/components/ui/breadcrumb'
import { CustomerSearch } from '../components/staging-invoices/customer-search'
import { InvoicesTable } from '../components/staging-invoices/invoices-table'
import { useSelectedStagingCustomer } from '../hooks/use-staging-invoices'
import { StagingCustomer } from '../types/staging-invoices'

export default function StagingInvoicesPage() {
    const { clearSelection } = useSelectedStagingCustomer()
    const [selectedCustomerState, setSelectedCustomerState] = useState<StagingCustomer | null>(null)
    const handleCustomerSelect = (customer: StagingCustomer) => {
        clearSelection()
        setSelectedCustomerState(customer)
    }

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
                                    <BreadcrumbLink href="/migrations" className="text-gray-400 hover:text-white">
                                        Migrations
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <FileText className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">Staging Invoices</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">Staging Invoices</h1>
                                    <p className="text-gray-400">
                                        Search and view staging customer invoices
                                    </p>
                                </div>
                                
                                {selectedCustomerState && (
                                    <Button
                                        onClick={() => {
                                            clearSelection()
                                            setSelectedCustomerState(null)
                                        }}
                                        variant="outline"
                                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Search
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Customer Search */}
                        <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5" />
                                    Customer Search
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomerSearch 
                                    placeholder="Search staging customers by name, email, or phone..."
                                    className="w-full"
                                    selectedCustomer={selectedCustomerState}
                                    onCustomerSelect={handleCustomerSelect}
                                    onClearSelection={clearSelection}
                                />
                            </CardContent>
                        </Card>

                        {/* Selected Customer Info */}
                        {selectedCustomerState && (
                            <Card className="bg-[#111111] border-[#2a2a2a] mb-6">
                                <CardHeader>
                                    <CardTitle className="text-white">Selected Customer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-red-600 rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {selectedCustomerState.customer_name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">
                                                {selectedCustomerState.customer_name || 'Unknown Customer'}
                                            </h3>
                                            <div className="text-sm text-gray-400 space-y-1">
                                                {selectedCustomerState.customer_email && (
                                                    <p>Email: {selectedCustomerState.customer_email}</p>
                                                )}
                                                {selectedCustomerState.customer_phone && (
                                                    <p>Phone: {selectedCustomerState.customer_phone}</p>
                                                )}
                                                {selectedCustomerState.customer_address && (
                                                    <p>Address: {selectedCustomerState.customer_address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Invoices Table */}
                        <InvoicesTable selectedCustomer={selectedCustomerState} />
                    </div>
                </div>
            </div>
        </div>
    )
}
