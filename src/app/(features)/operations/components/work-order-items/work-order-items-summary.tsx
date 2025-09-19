'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Wrench, Star, DollarSign, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useWorkOrderItemsSummary } from '../../hooks/use-work-order-items'

interface WorkOrderItemsSummaryProps {
    workOrderId: string
    className?: string
}

export const WorkOrderItemsSummary: React.FC<WorkOrderItemsSummaryProps> = ({
    workOrderId,
    className = ""
}) => {
    const { data: summary, isLoading, error } = useWorkOrderItemsSummary(workOrderId)

    if (isLoading) {
        return (
            <Card className={`bg-[#1a1a1a] border-[#2a2a2a] ${className}`}>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                        <div className="h-4 bg-[#2a2a2a] rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-[#2a2a2a] rounded animate-pulse w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !summary) {
        return (
            <Card className={`bg-[#1a1a1a] border-[#2a2a2a] ${className}`}>
                <CardContent className="p-4">
                    <p className="text-red-400 text-sm">Failed to load summary</p>
                </CardContent>
            </Card>
        )
    }

    const summaryItems = [
        {
            type: 'Labor',
            value: summary.totalLabor,
            icon: Wrench,
            color: 'text-blue-400'
        },
        {
            type: 'Parts',
            value: summary.totalParts,
            icon: Package,
            color: 'text-green-400'
        },
        {
            type: 'Services',
            value: summary.totalServices,
            icon: Star,
            color: 'text-purple-400'
        },
        {
            type: 'Fees',
            value: summary.totalFees,
            icon: DollarSign,
            color: 'text-orange-400'
        }
    ]

    return (
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cost Summary
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 ml-auto">
                        {summary.itemCount} items
                    </Badge>
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
                                    <span className="text-xs text-gray-400">{item.type}</span>
                                </div>
                                <span className="text-xs text-gray-300 font-medium">
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                        )
                    })}

                    {/* Separator if there are individual items */}
                    {summary.itemCount > 0 && (
                        <hr className="border-[#2a2a2a] my-3" />
                    )}

                    {/* Grand Total */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Total</span>
                        <span className="text-sm font-semibold text-green-400">
                            {formatCurrency(summary.grandTotal)}
                        </span>
                    </div>

                    {/* Empty state */}
                    {summary.itemCount === 0 && (
                        <div className="text-center py-4">
                            <p className="text-xs text-gray-500">No items added yet</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
