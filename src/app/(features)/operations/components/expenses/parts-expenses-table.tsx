'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { Package, Receipt, Wallet } from 'lucide-react'
import { WorkOrderQuickView } from '@/components/shared/quick-view/WorkOrderQuickView'
import type { UnifiedExpenseItem } from '@/app/api/operations/expenses/route'
import EditExpenseModal from '@/app/financials/efficiency/components/EditExpenseModal'

interface PartsExpensesTableProps {
    items: UnifiedExpenseItem[]
    isLoading: boolean
    error: Error | null
    onExpenseUpdated?: () => void
}

export function PartsExpensesTable({ items, isLoading, error, onExpenseUpdated }: PartsExpensesTableProps) {
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
    const [selectedGeneralExpense, setSelectedGeneralExpense] = useState<UnifiedExpenseItem | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const handleRowClick = (item: UnifiedExpenseItem) => {
        if (item.source === 'general') {
            // Open edit modal for general expenses
            setSelectedGeneralExpense(item)
            setIsEditModalOpen(true)
        } else if (item.work_order_id) {
            // Open work order quick view for work order items
            setSelectedWorkOrderId(item.work_order_id)
            setIsQuickViewOpen(true)
        }
    }

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false)
        setSelectedWorkOrderId(null)
    }

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false)
        setSelectedGeneralExpense(null)
    }

    const handleExpenseUpdated = () => {
        handleCloseEditModal()
        if (onExpenseUpdated) {
            onExpenseUpdated()
        }
    }

    const getItemTypeIcon = (itemType: string) => {
        if (itemType === 'part') {
            return <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
        } else if (itemType === 'expense') {
            return <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        } else if (itemType === 'general_expense') {
            return <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        }
        return null
    }

    const getItemTypeBadge = (itemType: string) => {
        if (itemType === 'part') {
            return (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    Part
                </Badge>
            )
        } else if (itemType === 'expense') {
            return (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                    Expense
                </Badge>
            )
        } else if (itemType === 'general_expense') {
            return (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    General
                </Badge>
            )
        }
        return null
    }


    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 w-32" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">Error loading parts and expenses: {error.message}</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No parts or expenses found</p>
            </div>
        )
    }

    // Transform general expense to the format expected by EditExpenseModal
    const transformToEditableExpense = (item: UnifiedExpenseItem) => ({
        id: item.id,
        cost_name: item.description,
        amount: item.unit_price,
        category: item.category,
        cost_date: item.created_at,
        payment_method: item.payment_method,
        vendor: item.vendor,
        notes: item.notes
    })

    return (
        <>
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Part # / Vendor</TableHead>
                            <TableHead className="w-[100px] text-right">Quantity</TableHead>
                            <TableHead className="w-[120px] text-right">Unit Price</TableHead>
                            <TableHead className="w-[120px] text-right">Cost</TableHead>
                            <TableHead className="w-[120px] text-right">Total</TableHead>
                            <TableHead className="w-[150px]">Supplier</TableHead>
                            <TableHead className="w-[150px]">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const itemTotal = item.source === 'general' 
                                ? item.unit_price 
                                : (item.quantity || 0) * (item.unit_price || 0)
                            const itemCost = item.total_cost || 0
                            const isGeneralExpense = item.source === 'general'

                            return (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(item)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getItemTypeIcon(item.item_type)}
                                            {getItemTypeBadge(item.item_type)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isGeneralExpense ? (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                                    General Expense
                                                </Badge>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="font-medium text-foreground">
                                                    {item.work_order?.work_order_number || 'N/A'}
                                                </div>
                                                {item.work_order?.title && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {item.work_order.title}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-foreground">{item.description}</div>
                                        {item.notes && isGeneralExpense && (
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {item.notes}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {isGeneralExpense ? (item.vendor || '-') : (item.part_number || '-')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-foreground">{item.quantity || (isGeneralExpense ? 1 : 0)}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-foreground">{formatCurrency(item.unit_price || 0)}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-muted-foreground text-sm">
                                            {itemCost > 0 ? formatCurrency(itemCost) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-medium text-foreground">
                                            {formatCurrency(itemTotal)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {item.supplier || item.vendor || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Work Order Quick View */}
            {selectedWorkOrderId && (
                <WorkOrderQuickView
                    workOrderId={selectedWorkOrderId}
                    isOpen={isQuickViewOpen}
                    onClose={handleCloseQuickView}
                />
            )}

            {/* Edit General Expense Modal */}
            {selectedGeneralExpense && (
                <EditExpenseModal 
                    expense={transformToEditableExpense(selectedGeneralExpense)}
                    onExpenseUpdated={handleExpenseUpdated}
                    onExpenseDeleted={handleExpenseUpdated}
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                />
            )}
        </>
    )
}
