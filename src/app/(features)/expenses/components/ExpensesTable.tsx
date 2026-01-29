/**
 * Expenses Table Component
 * 
 * Works directly with ExpenseItem from the expenses table.
 * Displays expenses with proper formatting and interactions.
 */

'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Receipt, Wallet, FileText } from 'lucide-react'
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView'
import type { ExpenseItem } from '../types/expenses'
import { ExpenseDetailDialog } from './ExpenseDetailDialog'

interface ExpensesTableProps {
    items: ExpenseItem[]
    isLoading: boolean
    error: Error | null
    onExpenseUpdated?: () => void
    shopId?: string
}

export function ExpensesTable({ items, isLoading, error, onExpenseUpdated, shopId = '' }: ExpensesTableProps) {
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

    const handleRowClick = (item: ExpenseItem) => {
        setSelectedExpense(item)
        setIsDetailDialogOpen(true)
    }

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false)
        setSelectedWorkOrderId(null)
    }

    const handleCloseDetailDialog = () => {
        setIsDetailDialogOpen(false)
        setSelectedExpense(null)
        onExpenseUpdated?.()
    }

    const handleViewWorkOrder = (workOrderId: string) => {
        setIsDetailDialogOpen(false)
        setSelectedWorkOrderId(workOrderId)
        setIsQuickViewOpen(true)
    }

    const getSourceTypeIcon = (sourceType: ExpenseItem['source_type']) => {
        if (sourceType === 'work_order') {
            return <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        } else if (sourceType === 'invoice') {
            return <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        } else if (sourceType === 'general') {
            return <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        }
        return null
    }

    const getSourceTypeBadge = () => {
        return (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                Expense
            </Badge>
        )
    }


    if (isLoading) {
        return (
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Category</TableHead>
                            <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                            <TableHead className="w-[100px] text-right">Tax</TableHead>
                            <TableHead className="w-[120px] text-right">Total</TableHead>
                            <TableHead className="w-[150px]">Vendor</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 rounded" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-24" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-48" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-5 w-16 ml-auto" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-5 w-12 ml-auto" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-5 w-16 ml-auto" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">Error loading expenses: {error.message}</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No expenses found</p>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Category</TableHead>
                            <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                            <TableHead className="w-[100px] text-right">Tax</TableHead>
                            <TableHead className="w-[120px] text-right">Total</TableHead>
                            <TableHead className="w-[150px]">Vendor</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const isGeneralExpense = item.source_type === 'general'
                            const isRefunded = (item.refund_amount && item.refund_amount > 0) || item.resolution_type === 'returned'

                            return (
                                <TableRow
                                    key={item.id}
                                    className={`cursor-pointer hover:bg-muted/50 ${isRefunded ? 'bg-red-500/10' : ''}`}
                                    onClick={() => handleRowClick(item)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getSourceTypeIcon(item.source_type)}
                                            {getSourceTypeBadge()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isGeneralExpense ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                                    General Expense
                                                </Badge>
                                            </div>
                                        ) : item.work_order_id ? (
                                            <div className="font-medium text-foreground">
                                                Work Order
                                            </div>
                                        ) : item.invoice_id ? (
                                            <div className="font-medium text-foreground">
                                                Invoice
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground text-sm">-</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-foreground">{item.description}</div>
                                        {item.notes && (
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {item.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {item.category || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-foreground">{formatCurrency(item.subtotal)}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-muted-foreground text-sm">
                                            {item.tax_amount ? formatCurrency(item.tax_amount) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium text-foreground">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {item.vendor || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {formatDate(item.expense_date)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="font-semibold">
                            <TableCell colSpan={4} className="text-right">
                                <span className="text-foreground">Total:</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-foreground">
                                    {formatCurrency(
                                        items.reduce((sum, item) => {
                                            const refund = item.refund_amount || 0
                                            return sum + Math.max(0, item.subtotal - refund)
                                        }, 0)
                                    )}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-foreground">
                                    {formatCurrency(
                                        items.reduce((sum, item) => {
                                            if (item.refund_amount && item.refund_amount >= item.total) return sum
                                            return sum + (item.tax_amount || 0)
                                        }, 0)
                                    )}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-foreground text-lg font-bold">
                                    {formatCurrency(
                                        items.reduce((sum, item) => {
                                            const refund = item.refund_amount || 0
                                            return sum + Math.max(0, item.total - refund)
                                        }, 0)
                                    )}
                                </span>
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>

            {/* Expense Detail Dialog */}
            <ExpenseDetailDialog
                expense={selectedExpense}
                isOpen={isDetailDialogOpen}
                onClose={handleCloseDetailDialog}
                onViewWorkOrder={handleViewWorkOrder}
                shopId={shopId}
            />

            {/* Work Order Quick View */}
            {selectedWorkOrderId && (
                <WorkOrderQuickView
                    workOrderId={selectedWorkOrderId}
                    isOpen={isQuickViewOpen}
                    onClose={handleCloseQuickView}
                />
            )}
        </>
    )
}
