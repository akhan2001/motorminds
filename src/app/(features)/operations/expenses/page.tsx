'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'
import { usePartsAndExpenses, type ExpenseFilters } from '../hooks/use-parts-expenses'
import { PartsExpensesTable } from '../components/expenses/parts-expenses-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Receipt, ArrowLeft, Plus, Wallet, Search, X, Filter } from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useDebouncedSearch } from '@/app/(features)/admin/hooks/use-debounced-search'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import AddExpenseModal from '@/app/financials/efficiency/components/AddExpenseModal'

export default function ExpensesPage() {
    const router = useRouter()
    const { shopId } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 50
    const includeGeneralExpenses = true // Always include general expenses

    // Search with debounce
    const { 
        searchTerm: searchInput, 
        debouncedSearchTerm: debouncedSearch, 
        updateSearchTerm: setSearchInput,
        clearSearch,
        isSearching 
    } = useDebouncedSearch('', 300)

    // Supplier filter - using dropdown
    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter(s => s.status === 'active')
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all')
    
    // Get supplier name from ID for API filtering
    const selectedSupplierName = useMemo(() => {
        if (selectedSupplierId === 'all') return undefined
        const supplier = activeSuppliers.find(s => s.id === selectedSupplierId)
        return supplier?.name
    }, [selectedSupplierId, activeSuppliers])

    // Date filters (YYYY-MM-DD format for native input)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    
    // Item type filter
    const [itemType, setItemType] = useState<'part' | 'expense' | 'general_expense' | 'all'>('all')

    // Build filters object
    const filters: ExpenseFilters = useMemo(() => ({
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        supplier: selectedSupplierName,
        itemType: itemType === 'all' ? undefined : itemType,
    }), [debouncedSearch, selectedSupplierName, startDate, endDate, itemType])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearch, selectedSupplierId, startDate, endDate, itemType])

    const { data, isLoading, error, refetch } = usePartsAndExpenses(
        shopId, 
        currentPage, 
        pageSize, 
        includeGeneralExpenses,
        filters
    )

    const totalPages = data ? Math.ceil(data.count / pageSize) : 0

    // Check if any filters are active
    const hasActiveFilters = !!(searchInput || selectedSupplierId !== 'all' || startDate || endDate || itemType !== 'all')

    // Clear all filters
    const clearAllFilters = () => {
        clearSearch()
        setSelectedSupplierId('all')
        setStartDate('')
        setEndDate('')
        setItemType('all')
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/operations/work-orders')} className="-ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground dark:text-white">
                            Parts & Expenses
                        </h1>
                    </div>
                    <p className="text-muted-foreground dark:text-gray-400 ml-11">
                        View all parts and expenses across all work orders and general business expenses
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {shopId && (
                        <AddExpenseModal shopId={shopId} onExpenseAdded={refetch}>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Expense
                            </Button>
                        </AddExpenseModal>
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search & Filters
                        </CardTitle>
                        {hasActiveFilters && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={clearAllFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear all
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-2">
                            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                                Search
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search by name or work order #..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pl-9"
                                />
                                {searchInput && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                        onClick={clearSearch}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            {isSearching && (
                                <p className="text-xs text-muted-foreground mt-1">Searching...</p>
                            )}
                        </div>

                        {/* Supplier/Vendor Filter */}
                        <div>
                            <Label htmlFor="supplier" className="text-sm font-medium mb-2 block">
                                Supplier/Vendor
                            </Label>
                            <Select 
                                value={selectedSupplierId} 
                                onValueChange={setSelectedSupplierId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All suppliers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Suppliers</SelectItem>
                                    {activeSuppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range - Start */}
                        <div>
                            <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
                                From Date
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={endDate || undefined}
                                className="w-full"
                            />
                        </div>

                        {/* Date Range - End */}
                        <div>
                            <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
                                To Date
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || undefined}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Second row - Item Type Filter */}
                    <div className="mt-4 flex items-center gap-4">
                        <div className="w-48">
                            <Label htmlFor="itemType" className="text-sm font-medium mb-2 block">
                                Item Type
                            </Label>
                            <Select 
                                value={itemType} 
                                onValueChange={(v) => setItemType(v as 'part' | 'expense' | 'general_expense' | 'all')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="part">Parts</SelectItem>
                                    <SelectItem value="expense">Work Order Expenses</SelectItem>
                                    <SelectItem value="general_expense">General Expenses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active filters summary */}
                        {hasActiveFilters && (
                            <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground self-end pb-2">
                                <span>Showing filtered results</span>
                                {data && (
                                    <span className="font-medium text-foreground">
                                        ({data.count} items found)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.stats?.totalItems || data.count}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Showing {data.data.length} of {data.count} items
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Parts</CardTitle>
                            <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.stats?.partsCount || data.data.filter(item => item.item_type === 'part').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total parts</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Work Order Expenses</CardTitle>
                            <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.stats?.expensesCount || data.data.filter(item => item.item_type === 'expense').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Linked to work orders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">General Expenses</CardTitle>
                            <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.stats?.generalExpensesCount || data.data.filter(item => item.item_type === 'general_expense').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Business expenses</p>
                        </CardContent>
                    </Card>
                </div>
            ) : null}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        All Parts & Expenses
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {hasActiveFilters 
                                ? `(${data?.count || 0} filtered results)`
                                : '(including general business expenses)'
                            }
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PartsExpensesTable
                        items={data?.data || []}
                        isLoading={isLoading}
                        error={error as Error | null}
                        onExpenseUpdated={refetch}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        // Show pages around current page
                                        let page: number
                                        if (totalPages <= 5) {
                                            page = i + 1
                                        } else if (currentPage <= 3) {
                                            page = i + 1
                                        } else if (currentPage >= totalPages - 2) {
                                            page = totalPages - 4 + i
                                        } else {
                                            page = currentPage - 2 + i
                                        }
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(page)}
                                                    isActive={page === currentPage}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        )
                                    })}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
