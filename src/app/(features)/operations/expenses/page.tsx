'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'
import { usePartsAndExpenses } from '../hooks/use-parts-expenses'
import { PartsExpensesTable } from '../components/expenses/parts-expenses-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Package, Receipt, ArrowLeft, Plus, Wallet } from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import AddExpenseModal from '@/app/financials/efficiency/components/AddExpenseModal'

export default function ExpensesPage() {
    const router = useRouter()
    const { shopId } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    const [includeGeneralExpenses, setIncludeGeneralExpenses] = useState(true)
    const pageSize = 50

    const { data, isLoading, error, refetch } = usePartsAndExpenses(shopId, currentPage, pageSize, includeGeneralExpenses)

    const totalPages = data ? Math.ceil(data.count / pageSize) : 0

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleToggleGeneralExpenses = (checked: boolean) => {
        setIncludeGeneralExpenses(checked)
        setCurrentPage(1) // Reset to first page when toggling
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
                        View all parts and expenses across all work orders
                        {includeGeneralExpenses && ' and general business expenses'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Filter Toggle */}
                    <div className="flex items-center gap-2 bg-muted/50 dark:bg-muted/20 px-4 py-2 rounded-lg">
                        <Switch
                            id="include-general"
                            checked={includeGeneralExpenses}
                            onCheckedChange={handleToggleGeneralExpenses}
                        />
                        <Label 
                            htmlFor="include-general" 
                            className="text-sm text-foreground dark:text-white cursor-pointer"
                        >
                            Include General Expenses
                        </Label>
                    </div>
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

            {/* Stats Cards */}
            {data && (
                <div className={`grid grid-cols-1 gap-4 ${includeGeneralExpenses ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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
                    {includeGeneralExpenses && (
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
                    )}
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        All Parts & Expenses
                        {includeGeneralExpenses && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                (including general business expenses)
                            </span>
                        )}
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
