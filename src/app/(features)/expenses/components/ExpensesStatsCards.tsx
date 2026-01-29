'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Receipt, Wallet, FileText } from 'lucide-react'
import type { ExpensesStatsCardsProps } from '../types/expenses'

export function ExpensesStatsCards({
    isLoading,
    stats,
    totalCount,
    currentPageCount,
}: ExpensesStatsCardsProps) {
    if (isLoading) {
        return (
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
        )
    }

    if (!stats && totalCount === undefined) {
        return null
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalExpenses || totalCount || 0}</div>
                    {currentPageCount !== undefined && totalCount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Showing {currentPageCount} of {totalCount} expenses
                        </p>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Work Order Expenses</CardTitle>
                    <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.workOrderExpenses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Linked to work orders</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Invoice Expenses</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.invoiceExpenses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Linked to invoices</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">General Expenses</CardTitle>
                    <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats?.generalExpenses || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Business expenses</p>
                </CardContent>
            </Card>
        </div>
    )
}
