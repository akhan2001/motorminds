'use client'

import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { DollarSign } from 'lucide-react'
import type { CreditRefundItem } from '../types/credits-refunds'
import { CreditRefundDetailDialog } from './CreditRefundDetailDialog'

interface CreditsRefundsTableProps {
    items: CreditRefundItem[]
    isLoading: boolean
    error: Error | null
    onCreditRefundUpdated?: () => void
    shopId?: string
}

function getStatusBadge(status: CreditRefundItem['status']) {
    const variants: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        processed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        reconciled: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    }
    return (
        <Badge variant="outline" className={variants[status] || ''}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    )
}

export function CreditsRefundsTable({
    items,
    isLoading,
    error,
    onCreditRefundUpdated,
    shopId = '',
}: CreditsRefundsTableProps) {
    const [selectedItem, setSelectedItem] = useState<CreditRefundItem | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const handleRowClick = (item: CreditRefundItem) => {
        setSelectedItem(item)
        setIsDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setIsDetailOpen(false)
        setSelectedItem(null)
        onCreditRefundUpdated?.()
    }

    if (isLoading) {
        return (
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Description / Reason</TableHead>
                            <TableHead className="w-[120px] text-right">Amount</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[150px]">Related</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-48" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
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
                <p className="text-red-600 dark:text-red-400">
                    Error loading credits/refunds: {error.message}
                </p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">No credits or refunds found</p>
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Description / Reason</TableHead>
                            <TableHead className="w-[120px] text-right">Amount</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead className="w-[150px]">Related Expense</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow
                                key={item.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleRowClick(item)}
                            >
                                <TableCell>
                                    <div className="text-foreground text-sm">
                                        {formatDate(item.refund_date)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-foreground">
                                        {item.supplier || '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-foreground">
                                        {item.related_expense
                                            ? item.related_expense.description
                                            : item.description || item.reason}
                                    </div>
                                    {!item.related_expense && (item.part_number || item.invoice_number) && (
                                        <div className="text-xs text-muted-foreground">
                                            {[item.part_number && `Part #: ${item.part_number}`, item.invoice_number && `Inv #: ${item.invoice_number}`]
                                                .filter(Boolean)
                                                .join(' • ')}
                                        </div>
                                    )}
                                    {item.notes && (
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {item.notes}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="font-medium text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
                                        <DollarSign className="h-4 w-4" />
                                        {formatCurrency(item.amount)}
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(item.status)}</TableCell>
                                <TableCell>
                                    <div className="text-muted-foreground text-sm">
                                        {item.related_expense ? (
                                            <span
                                                title={`${item.related_expense.description} • ${item.related_expense.vendor || 'N/A'}`}
                                                className="truncate max-w-[180px] block"
                                            >
                                                {item.related_expense.description}
                                                {item.related_expense.work_order_id && (
                                                    <span className="text-xs ml-1">(WO)</span>
                                                )}
                                            </span>
                                        ) : item.related_expense_id ? (
                                            'Expense linked'
                                        ) : (
                                            '-'
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <CreditRefundDetailDialog
                creditRefund={selectedItem}
                isOpen={isDetailOpen}
                onClose={handleCloseDetail}
                onUpdated={onCreditRefundUpdated}
                shopId={shopId}
            />
        </>
    )
}
