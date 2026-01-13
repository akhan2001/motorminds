'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'
import { usePartsAndExpenses } from '../hooks/use-parts-expenses'
import { PartsExpensesTable } from '../components/expenses/parts-expenses-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Receipt, ArrowLeft, Plus } from 'lucide-react'
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
    const pageSize = 50

    const { data, isLoading, error, refetch } = usePartsAndExpenses(shopId, currentPage, pageSize)

    const totalPages = data ? Math.ceil(data.count / pageSize) : 0

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
                        View all parts and expenses across all work orders
                    </p>
                </div>
                <div className="flex gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.count}</div>
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
                                {data.data.filter(item => item.item_type === 'part').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">On this page</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                            <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.data.filter(item => item.item_type === 'expense').length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">On this page</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Parts & Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <PartsExpensesTable
                        items={data?.data || []}
                        isLoading={isLoading}
                        error={error as Error | null}
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
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => handlePageChange(page)}
                                                isActive={page === currentPage}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
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

