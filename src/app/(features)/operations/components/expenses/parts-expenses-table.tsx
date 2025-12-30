'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { Package, Receipt } from 'lucide-react'
import { WorkOrderDetailSheet } from '../work-orders/shared/work-order-detail-sheet'
import { useWorkOrderWithDetails } from '../../hooks/use-work-orders'
import type { WorkOrderItem } from '../../types/work-order-items'

interface PartsExpensesTableProps {
    items: (WorkOrderItem & { work_order: { id: string; work_order_number: string; title: string | null } })[]
    isLoading: boolean
    error: Error | null
}

export function PartsExpensesTable({ items, isLoading, error }: PartsExpensesTableProps) {
    const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Fetch full work order details when sheet is open
    const { data: selectedWorkOrder } = useWorkOrderWithDetails(selectedWorkOrderId || '')

    const handleRowClick = (workOrderId: string) => {
        setSelectedWorkOrderId(workOrderId)
        setIsSheetOpen(true)
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setSelectedWorkOrderId(null)
    }

    const getItemTypeIcon = (itemType: string) => {
        if (itemType === 'part') {
            return <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
        } else if (itemType === 'expense') {
            return <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
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

    return (
        <>
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Work Order</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Part #</TableHead>
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
                            const itemTotal = (item.quantity || 0) * (item.unit_price || 0)
                            const itemCost = item.total_cost || 0
                            const isActive = item.active !== false

                            return (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleRowClick(item.work_order_id)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getItemTypeIcon(item.item_type)}
                                            {getItemTypeBadge(item.item_type)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">
                                            {item.work_order?.work_order_number || 'N/A'}
                                        </div>
                                        {item.work_order?.title && (
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {item.work_order.title}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-foreground">{item.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {item.part_number || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-foreground">{item.quantity || 0}</div>
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
                                        <div className={`font-medium ${!isActive ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                                            {formatCurrency(itemTotal)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-muted-foreground text-sm">
                                            {item.supplier || '-'}
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

            {/* Work Order Detail Sheet */}
            <WorkOrderDetailSheet
                workOrder={selectedWorkOrder || null}
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
            />
        </>
    )
}

