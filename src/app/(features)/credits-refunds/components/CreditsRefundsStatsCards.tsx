'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Clock, CheckCircle2, FileCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

interface CreditsRefundsStatsCardsProps {
    isLoading: boolean
    stats?: {
        totalAmount: number
        count: number
        byStatus: Record<string, { count: number; total: number }>
    }
    totalCount?: number
}

export function CreditsRefundsStatsCards({
    isLoading,
    stats,
    totalCount,
}: CreditsRefundsStatsCardsProps) {
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

    const pending = stats?.byStatus?.pending || { count: 0, total: 0 }
    const processed = stats?.byStatus?.processed || { count: 0, total: 0 }
    const reconciled = stats?.byStatus?.reconciled || { count: 0, total: 0 }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(stats?.totalAmount || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats?.count || totalCount || 0} records
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pending.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(pending.total)}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Processed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{processed.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(processed.total)}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reconciled</CardTitle>
                    <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reconciled.count}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(reconciled.total)}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
