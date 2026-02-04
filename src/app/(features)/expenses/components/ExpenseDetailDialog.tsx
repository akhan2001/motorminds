/**
 * Expense Detail Dialog
 * 
 * Shows expense details with refund functionality.
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate, getTorontoDateString } from '@/lib/utils/date'
import { ExpensesService } from '../lib/expenses-service'
import { expenseKeys } from '../data/keys'
import type { ExpenseItem } from '../types/expenses'
import {
    Receipt,
    Wallet,
    FileText,
    Calendar,
    Building2,
    CreditCard,
    Tag,
    FileCheck,
    ExternalLink,
    DollarSign,
    StickyNote,
    ShieldCheck,
    Loader2,
    Undo2,
    CheckCircle2,
} from 'lucide-react'

interface ExpenseDetailDialogProps {
    expense: ExpenseItem | null
    isOpen: boolean
    onClose: () => void
    onViewWorkOrder?: (workOrderId: string) => void
    /** When provided, enables Edit button (e.g. for general expenses). Call to open edit modal. */
    onEdit?: (expense: ExpenseItem) => void
    shopId?: string
}

function formatExpenseDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A'
    const datePart = dateString.substring(0, 10)
    return getTorontoDateString(new Date(datePart + 'T12:00:00'))
}

export function ExpenseDetailDialog({
    expense,
    isOpen,
    onClose,
    onViewWorkOrder,
    onEdit,
    shopId = '',
}: ExpenseDetailDialogProps) {
    const queryClient = useQueryClient()

    // Refund form state
    const [showRefundForm, setShowRefundForm] = useState(false)
    const [refundAmount, setRefundAmount] = useState('')
    const [refundNote, setRefundNote] = useState('')

    // Reset form when dialog opens/closes or expense changes
    useEffect(() => {
        if (isOpen && expense) {
            setShowRefundForm(false)
            setRefundAmount(expense.total?.toString() || '')
            setRefundNote('')
        }
    }, [isOpen, expense?.id, expense?.total])

    // Refund mutation
    const refundMutation = useMutation({
        mutationFn: async () => {
            if (!expense) throw new Error('No expense selected')
            const amount = parseFloat(refundAmount) || 0
            return ExpensesService.resolveExpense(expense.id, shopId, {
                resolution_type: 'returned',
                resolution_note: refundNote || `Refunded ${formatCurrency(amount)}`,
                refund_amount: amount,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId) })
            onClose()
        },
    })

    const handleRefund = async () => {
        const amount = parseFloat(refundAmount) || 0
        if (amount <= 0 || !expense || amount > expense.total) return
        await refundMutation.mutateAsync()
    }

    if (!expense) return null

    const isRefunded = expense.resolution_type === 'returned' || (expense.refund_amount && expense.refund_amount > 0)
    const refundAmountNum = parseFloat(refundAmount) || 0
    const isValidRefund = refundAmountNum > 0 && refundAmountNum <= expense.total

    const getSourceTypeIcon = () => {
        switch (expense.source_type) {
            case 'work_order':
                return <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            case 'invoice':
                return <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            case 'general':
                return <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            default:
                return null
        }
    }

    const getSourceTypeBadge = () => {
        switch (expense.source_type) {
            case 'work_order':
                return (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                        Work Order
                    </Badge>
                )
            case 'invoice':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                        Invoice
                    </Badge>
                )
            case 'general':
                return (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                        General
                    </Badge>
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getSourceTypeIcon()}
                        <div>
                            <DialogTitle className="text-lg">Expense Details</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                {getSourceTypeBadge()}
                                {isRefunded && (
                                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Refunded
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Description */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <h3 className="font-medium text-foreground mb-1">{expense.description}</h3>
                        {expense.parts_description && (
                            <p className="text-sm text-muted-foreground">{expense.parts_description}</p>
                        )}
                    </div>

                    {/* Amount Section */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                            <p className="font-medium text-foreground">{formatCurrency(expense.subtotal)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Tax</p>
                            <p className="font-medium text-foreground">{expense.tax_amount ? formatCurrency(expense.tax_amount) : '-'}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className="font-semibold text-lg text-foreground">{formatCurrency(expense.total)}</p>
                        </div>
                    </div>

                    {/* Refund Amount (if already refunded) */}
                    {expense.refund_amount !== null && expense.refund_amount !== undefined && expense.refund_amount > 0 && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-center justify-between">
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Refunded
                            </span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(expense.refund_amount)}
                            </span>
                        </div>
                    )}

                    <Separator />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Category</p>
                                <p className="text-foreground">{expense.category || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="text-foreground">{formatExpenseDate(expense.expense_date)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Vendor</p>
                                <p className="text-foreground">{expense.vendor || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="text-xs text-muted-foreground">Payment</p>
                                <p className="text-foreground capitalize">{expense.payment_method?.replace('_', ' ') || '-'}</p>
                            </div>
                        </div>

                        {expense.invoice_number && (
                            <div className="flex items-start gap-2">
                                <FileCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Invoice #</p>
                                    <p className="text-foreground">{expense.invoice_number}</p>
                                </div>
                            </div>
                        )}

                        {expense.warranty_period && (
                            <div className="flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Warranty</p>
                                    <p className="text-foreground">{expense.warranty_period}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {expense.notes && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-2">
                                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm text-foreground">{expense.notes}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Resolution Note (if refunded) */}
                    {expense.resolution_note && (
                        <>
                            <Separator />
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Refund Notes</p>
                                <p className="text-sm text-foreground">{expense.resolution_note}</p>
                                {expense.resolved_at && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDate(expense.resolved_at)}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Work Order Link */}
                    {expense.work_order_id && onViewWorkOrder && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Receipt className="h-4 w-4" />
                                    <span>Work Order</span>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => onViewWorkOrder(expense.work_order_id!)}
                                    className="flex items-center gap-1"
                                >
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Refund Section */}
                    {!isRefunded && (
                        <>
                            <Separator />
                            {!showRefundForm ? (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setShowRefundForm(true)}
                                >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Refund Expense
                                </Button>
                            ) : (
                                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">Refund Expense</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowRefundForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="refund-amount" className="text-sm">Refund Amount</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">$</span>
                                            <Input
                                                id="refund-amount"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={expense.total}
                                                value={refundAmount}
                                                onChange={(e) => setRefundAmount(e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setRefundAmount(expense.total.toString())}
                                            >
                                                Full
                                            </Button>
                                        </div>
                                        {refundAmountNum > expense.total && (
                                            <p className="text-xs text-red-500">Cannot exceed {formatCurrency(expense.total)}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="refund-note" className="text-sm">Note (optional)</Label>
                                        <Textarea
                                            id="refund-note"
                                            value={refundNote}
                                            onChange={(e) => setRefundNote(e.target.value)}
                                            placeholder="Refund reason or reference..."
                                            rows={2}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleRefund}
                                        disabled={!isValidRefund || refundMutation.isPending}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {refundMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Refund {isValidRefund ? formatCurrency(refundAmountNum) : ''}
                                            </>
                                        )}
                                    </Button>

                                    {refundMutation.isError && (
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            Failed: {refundMutation.error?.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2">
                    {onEdit && (
                        <Button variant="outline" onClick={() => onEdit(expense)} className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
