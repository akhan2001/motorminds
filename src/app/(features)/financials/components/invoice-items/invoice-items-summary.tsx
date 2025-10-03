'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Package, Wrench, Briefcase, DollarSign, Receipt, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInvoiceSummary } from '../../hooks/use-invoice-items'

interface InvoiceItemsSummaryProps {
    invoiceId: string
    className?: string
    showBreakdown?: boolean
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount)
}

export const InvoiceItemsSummary: React.FC<InvoiceItemsSummaryProps> = ({
    invoiceId,
    className,
    showBreakdown = true,
}) => {
    const { data: summary, isLoading, error } = useInvoiceSummary(invoiceId)

    if (isLoading) {
        return (
            <Card className={cn('bg-[#1a1a1a] border-[#2a2a2a] p-6', className)}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                    <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
                    <div className="h-6 bg-[#2a2a2a] rounded w-full" />
                </div>
            </Card>
        )
    }

    if (error || !summary) {
        return (
            <Card className={cn('bg-[#1a1a1a] border-[#2a2a2a] p-6', className)}>
                <p className="text-red-400 text-sm">Failed to load summary</p>
            </Card>
        )
    }

    return (
        <Card className={cn('bg-[#1a1a1a] border-[#2a2a2a] p-6', className)}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-400" />
                        Invoice Summary
                    </h3>
                    <span className="text-sm text-gray-400">
                        {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Breakdown */}
                {showBreakdown && (
                    <div className="space-y-2">
                        {summary.partsTotal > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-green-400" />
                                    Parts
                                </span>
                                <span className="text-white font-medium">{formatCurrency(summary.partsTotal)}</span>
                            </div>
                        )}

                        {summary.laborTotal > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-blue-400" />
                                    Labor
                                    {summary.laborHoursTotal > 0 && (
                                        <span className="text-xs text-gray-500">({summary.laborHoursTotal} hrs)</span>
                                    )}
                                </span>
                                <span className="text-white font-medium">{formatCurrency(summary.laborTotal)}</span>
                            </div>
                        )}

                        {summary.servicesTotal > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-purple-400" />
                                    Services
                                </span>
                                <span className="text-white font-medium">{formatCurrency(summary.servicesTotal)}</span>
                            </div>
                        )}

                        {summary.feesTotal > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-yellow-400" />
                                    Fees
                                </span>
                                <span className="text-white font-medium">{formatCurrency(summary.feesTotal)}</span>
                            </div>
                        )}

                        <Separator className="bg-[#2a2a2a] my-2" />
                    </div>
                )}

                {/* Subtotal */}
                <div className="flex items-center justify-between text-base">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white font-medium">{formatCurrency(summary.subtotal)}</span>
                </div>

                {/* Discount */}
                {summary.totalDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Total Discount</span>
                        <span className="text-green-400">-{formatCurrency(summary.totalDiscount)}</span>
                    </div>
                )}

                {/* Tax */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Tax (13%)</span>
                    <span className="text-gray-300">{formatCurrency(summary.tax)}</span>
                </div>

                <Separator className="bg-[#2a2a2a]" />

                {/* Grand Total */}
                <div className="flex items-center justify-between text-xl pt-2">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-white font-bold">{formatCurrency(summary.grandTotal)}</span>
                </div>

                {/* Profit Indicator (if cost data available) */}
                {summary.subtotal > 0 && (
                    <div className="pt-3 border-t border-[#2a2a2a]">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Breakdown includes {summary.itemCount} line items</span>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default InvoiceItemsSummary

