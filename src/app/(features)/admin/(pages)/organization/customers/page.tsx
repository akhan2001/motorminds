'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { CustomerDetailSheet } from '../../../components/shared'
import { CustomerTable } from '../../../components/shared/CustomerTable'
import { useAdminContext } from '@/contexts/admin-context'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useDebouncedSearch } from '../../../hooks/use-debounced-search'

interface Customer {
    id: string
    customer_name: string
    customer_email?: string
    customer_phone?: string
    customer_address?: string
    shop_id: string
    created_at: string
    updated_at?: string
    notes?: string
    shops?: {
        shop_name: string
        shop_email?: string
    }
}

interface CustomerHistory {
    workOrders: Array<{
        id: string
        work_order_number: string
        status: string
        created_at: string
        total_amount?: number
        vehicle_info?: string
    }>
    invoices: Array<{
        id: string
        invoice_number: string
        status: string
        total_amount: number
        issue_date: string
    }>
    totalSpent: number
    lastVisit?: string
}

function OrganizationCustomersContent() {
    const { organizationId } = useAdminContext()
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    // Use the debounced search hook properly
    const { searchTerm, debouncedSearchTerm, updateSearchTerm } = useDebouncedSearch('', 500)

    // Fetch customers with optimized query using debounced search
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin', 'organization', organizationId, 'customers', debouncedSearchTerm, currentPage],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50'
            })
            
            // Only add search param if there's a search term
            if (debouncedSearchTerm.trim()) {
                params.set('search', debouncedSearchTerm.trim())
            }
            
            
            const res = await fetch(`/api/admin/organization/customers?${params}`)
            
            if (!res.ok) {
                const errorText = await res.text()
                console.error('Failed to fetch customers:', res.status, errorText)
                throw new Error(`Failed to fetch customers: ${res.status}`)
            }
            
            return res.json()
        },
        enabled: !!organizationId,
        staleTime: 30000, // 30 seconds
        keepPreviousData: true // Keep previous data while fetching new data
    })

    // Fetch customer history when a customer is selected
    const { data: customerHistory, isLoading: historyLoading, error: historyError } = useQuery({
        queryKey: ['admin', 'customer', selectedCustomer?.id, 'history'],
        queryFn: async () => {
            if (!selectedCustomer) return null
            
            
            const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/history`)
            
            if (!res.ok) {
                const errorText = await res.text()
                console.error('Failed to fetch customer history:', res.status, errorText)
                throw new Error(`Failed to fetch customer history: ${res.status}`)
            }
            
            return res.json()
        },
        enabled: !!selectedCustomer,
        staleTime: 60000, // 1 minute
        retry: 1 // Only retry once on failure
    })

    const handleCustomerClick = useCallback((customer: Customer) => {
        setSelectedCustomer(customer)
        setIsSheetOpen(true)
    }, [])

    const handleSheetClose = useCallback(() => {
        setIsSheetOpen(false)
        setSelectedCustomer(null)
    }, [])

    const handleSearch = useCallback((search: string) => {
        updateSearchTerm(search)
        setCurrentPage(1) // Reset to first page on search
    }, [updateSearchTerm])

    // Memoize customer data to prevent unnecessary re-renders
    const customers = useMemo(() => {
        return (data as any)?.customers || []
    }, [data])

    const totalCount = useMemo(() => {
        return (data as any)?.total || 0
    }, [data])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">Organization Customers</h1>
                        <p className="text-muted-foreground">
                            View and manage all customers across your organization's shops. Access customer details, history, and activity.
                        </p>
                    </div>
                </div>
                
                <CustomerTable
                    customers={customers}
                    loading={isLoading}
                    error={error?.message || null}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    itemsPerPage={50}
                    onCustomerClick={handleCustomerClick}
                    onSearch={handleSearch}
                    onPageChange={handlePageChange}
                    showShopName={true}
                />

                {/* Customer Detail Sheet */}
                <CustomerDetailSheet
                    customer={selectedCustomer}
                    customerHistory={customerHistory}
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    loading={historyLoading}
                    error={historyError?.message || null}
                />
            </div>
        </main>
    )
}

function OrganizationCustomersLoading() {
    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">Organization Customers</h1>
                        <p className="text-muted-foreground">
                            View and manage all customers across your organization's shops.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center justify-center py-12">
                    <Card className="bg-background">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-muted-foreground">Loading customers...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}

// Main component with Suspense wrapper
export default function OrganizationCustomersPage() {
    return (
        <Suspense fallback={<OrganizationCustomersLoading />}>
            <OrganizationCustomersContent />
        </Suspense>
    )
}