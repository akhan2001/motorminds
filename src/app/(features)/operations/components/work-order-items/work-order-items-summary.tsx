'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Wrench, Star, DollarSign, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useWorkOrderItemsSummary, useWorkOrderItems } from '../../hooks/use-work-order-items'

interface WorkOrderItemsSummaryProps {
    workOrderId: string
    className?: string
}

export const WorkOrderItemsSummary: React.FC<WorkOrderItemsSummaryProps> = ({
    workOrderId,
    className = ""
}) => {
    const { data: summary, isLoading, error } = useWorkOrderItemsSummary(workOrderId)
    const { data: allItems } = useWorkOrderItems(workOrderId)
    
    // Calculate rejected items count
    const rejectedItemsCount = allItems?.filter(item => item.active === false).length || 0
    const totalItemsCount = allItems?.length || 0

    if (isLoading) {
        return (
            <Card className={`bg-slate-50 dark:bg-card border-border ${className}`}>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="h-4 bg-white dark:bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-white dark:bg-muted rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-white dark:bg-muted rounded animate-pulse w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !summary) {
        return (
            <Card className={`bg-slate-50 dark:bg-card border-border ${className}`}>
                <CardContent className="p-4">
                    <p className="text-red-600 dark:text-red-400 text-sm">Failed to load summary</p>
                </CardContent>
            </Card>
        )
    }

    const summaryItems = [
        {
            type: 'Labor',
            value: summary.totalLabor,
            icon: Wrench,
            color: 'text-blue-600 dark:text-blue-400'
        },
        {
            type: 'Parts',
            value: summary.totalParts,
            icon: Package,
            color: 'text-green-600 dark:text-green-400'
        },
        {
            type: 'Services',
            value: summary.totalServices,
            icon: Star,
            color: 'text-purple-600 dark:text-purple-400'
        },
        {
            type: 'Fees',
            value: summary.totalFees,
            icon: DollarSign,
            color: 'text-orange-600 dark:text-orange-400'
        }
    ]

    return (
        <Card className={`bg-slate-50 dark:bg-card border-border ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    Cost Summary
                    <div className="ml-auto flex gap-2">
                        <Badge variant="outline" className="bg-white dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/20">
                            {summary.itemCount} approved
                        </Badge>
                        {rejectedItemsCount > 0 && (
                            <Badge variant="outline" className="bg-white dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20">
                                {rejectedItemsCount} rejected
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {/* Individual totals */}
                    {summaryItems.map((item) => {
                        const IconComponent = item.icon
                        if (item.value === 0) return null
                        
                        return (
                            <div key={item.type} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IconComponent className={`h-3 w-3 ${item.color}`} />
                                    <span className="text-xs text-muted-foreground">{item.type}</span>
                                </div>
                                <span className="text-xs text-foreground font-medium">
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                        )
                    })}

                    {/* Separator if there are individual items */}
                    {summary.itemCount > 0 && (
                        <hr className="border-border my-3" />
                    )}

                    {/* Grand Total */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Total (Approved Items Only)</span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(summary.grandTotal)}
                        </span>
                    </div>
                    
                    {/* Rejected items notice */}
                    {rejectedItemsCount > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 pt-1">
                            {rejectedItemsCount} rejected item(s) excluded from total
                        </div>
                    )}

                    {/* Empty state */}
                    {summary.itemCount === 0 && (
                        <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">No items added yet</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
