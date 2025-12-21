'use client'

import React from 'react'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import type { LaborFormItem, PartFormItem, GenericFormItem } from '../../../types/work-order-item-forms'

export interface WorkOrderFinancialSummaryProps {
    laborItems: LaborFormItem[]
    partsItems: PartFormItem[]
    serviceItems: GenericFormItem[]
    feeItems: GenericFormItem[]
    discountItems: GenericFormItem[]
    packageItems: GenericFormItem[]
    className?: string
}

export const WorkOrderFinancialSummary: React.FC<WorkOrderFinancialSummaryProps> = ({
    laborItems,
    partsItems,
    serviceItems,
    feeItems,
    discountItems,
    packageItems,
    className = ""
}) => {
    // Calculate totals for each category
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const partsTotal = partsItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const servicesTotal = serviceItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const feesTotal = feeItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const discountsTotal = discountItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const packagesTotal = packageItems.reduce((sum, item) => sum + (item.total_price || 0), 0)

    // Calculate labor hours
    const totalLaborHours = laborItems.reduce((sum, item) => sum + (item.labor_hours || 0), 0)

    // Calculate subtotal (discounts reduce the total)
    const subtotal = laborTotal + partsTotal + servicesTotal + feesTotal + packagesTotal - discountsTotal

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    // Check if there are any items
    const hasItems = laborItems.length > 0 ||
                     partsItems.length > 0 ||
                     serviceItems.length > 0 ||
                     feeItems.length > 0 ||
                     discountItems.length > 0 ||
                     packageItems.length > 0

    if (!hasItems) {
        return null // Don't show summary if no items
    }

    return (
        <div className={`bg-slate-50 dark:bg-[#1a1a1a] border border-border dark:border-[#333333] rounded-lg ${className}`}>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Financial Summary</h3>
                </div>

                <div className="space-y-3">
                    {/* Labor */}
                    {laborTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground dark:text-white">Labor</span>
                                {totalLaborHours > 0 && (
                                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                                        {totalLaborHours.toFixed(2)} hours
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {formatCurrency(laborTotal)}
                            </span>
                        </div>
                    )}

                    {/* Parts */}
                    {partsTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground dark:text-white">Parts</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">
                                    {partsItems.length} {partsItems.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {formatCurrency(partsTotal)}
                            </span>
                        </div>
                    )}

                    {/* Services */}
                    {servicesTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground dark:text-white">Services</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">
                                    {serviceItems.length} {serviceItems.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {formatCurrency(servicesTotal)}
                            </span>
                        </div>
                    )}

                    {/* Fees */}
                    {feesTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground dark:text-white">Fees</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">
                                    {feeItems.length} {feeItems.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {formatCurrency(feesTotal)}
                            </span>
                        </div>
                    )}

                    {/* Packages */}
                    {packagesTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground dark:text-white">Packages</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">
                                    {packageItems.length} {packageItems.length === 1 ? 'package' : 'packages'}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                {formatCurrency(packagesTotal)}
                            </span>
                        </div>
                    )}

                    {/* Discounts */}
                    {discountsTotal > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-border dark:border-[#333333]">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Discounts</span>
                                    <span className="text-xs text-muted-foreground dark:text-gray-400">
                                        {discountItems.length} {discountItems.length === 1 ? 'discount' : 'discounts'}
                                    </span>
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                -{formatCurrency(discountsTotal)}
                            </span>
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-border dark:border-[#333333]">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="text-lg font-bold text-foreground dark:text-white">Total</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-border dark:border-[#333333]">
                    <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-1">
                        <p>• Prices shown are estimates and may be adjusted</p>
                        <p>• Final amounts will be calculated when work order is saved</p>
                        {discountsTotal > 0 && (
                            <p className="text-green-600 dark:text-green-400">• Discounts have been applied to the total</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
