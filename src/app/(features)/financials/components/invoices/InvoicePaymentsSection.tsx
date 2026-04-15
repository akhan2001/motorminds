'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, DollarSign, CreditCard, AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import type { InvoiceWithDetails, Payment, InvoiceRefund } from '../../types/invoice'
import { useAddInvoicePayment, useRemoveInvoicePayment, useRemoveInvoiceRefund } from '../../hooks/use-invoice-payments'
import { AddPaymentDialog } from './AddPaymentDialog'
import { AddRefundDialog } from './AddRefundDialog'

interface InvoicePaymentsSectionProps {
    invoice: InvoiceWithDetails
}

export function InvoicePaymentsSection({ invoice }: InvoicePaymentsSectionProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [paymentToRemove, setPaymentToRemove] = useState<Payment | null>(null)
    const [refundToRemove, setRefundToRemove] = useState<InvoiceRefund | null>(null)
    const [deletionReason, setDeletionReason] = useState('')
    const addPayment = useAddInvoicePayment()
    const removePayment = useRemoveInvoicePayment()
    const removeRefund = useRemoveInvoiceRefund()

    const allPayments = (invoice.payments || []) as Payment[]
    // Filter out deleted/archived payments for display
    const payments = allPayments.filter(p => !p.deleted)

    const allRefunds = (invoice.refunds || []) as InvoiceRefund[]
    const refunds = allRefunds.filter(r => !r.deleted)

    // Calculate amount_paid from active payments as fallback if database value is incorrect
    const calculatedAmountPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const databaseAmountPaid = invoice.amount_paid || 0
    const amountPaid = Math.abs(calculatedAmountPaid - databaseAmountPaid) > 0.01
        ? calculatedAmountPaid
        : databaseAmountPaid

    // Calculate total_refunded from active refunds
    const calculatedTotalRefunded = refunds.reduce((sum, r) => sum + (r.amount || 0), 0)
    const databaseTotalRefunded = invoice.total_refunded || 0
    const totalRefunded = Math.abs(calculatedTotalRefunded - databaseTotalRefunded) > 0.01
        ? calculatedTotalRefunded
        : databaseTotalRefunded

    const netPaid = Math.max(0, amountPaid - totalRefunded)

    // Outstanding is based on payments only (refunds do not restore the balance for re-payment)
    const outstanding = invoice.status === 'draft' && (invoice.outstanding_balance === undefined || invoice.outstanding_balance === 0)
        ? invoice.total_amount
        : Math.max(0, invoice.total_amount - amountPaid)
    const paymentProgress = invoice.total_amount > 0
        ? (amountPaid / invoice.total_amount) * 100
        : 0

    const isZeroInvoice = invoice.total_amount === 0
    const canAddPayment = (
        (isZeroInvoice
            ? invoice.status !== 'paid' && payments.length === 0
            : outstanding > 0
        ) &&
        invoice.status !== 'cancelled' &&
        invoice.status !== 'refunded'
    )

    // Can issue a refund when there's paid amount that hasn't been refunded yet
    const maxRefundable = Math.max(0, amountPaid - totalRefunded)
    const canIssueRefund = (
        maxRefundable > 0.001 &&
        invoice.status !== 'cancelled' &&
        invoice.status !== 'refunded'
    )

    const handleRemovePayment = (payment: Payment) => {
        setPaymentToRemove(payment)
        setDeletionReason('')
    }

    const confirmRemovePayment = async () => {
        if (!paymentToRemove) return

        await removePayment.mutateAsync({
            invoiceNumber: invoice.invoice_number,
            paymentId: paymentToRemove.id,
            deletionReason: deletionReason.trim() || undefined
        })
        setPaymentToRemove(null)
        setDeletionReason('')
    }

    const cancelRemovePayment = () => {
        setPaymentToRemove(null)
        setDeletionReason('')
    }

    const handleRemoveRefund = (refund: InvoiceRefund) => {
        setRefundToRemove(refund)
        setDeletionReason('')
    }

    const confirmRemoveRefund = async () => {
        if (!refundToRemove) return

        await removeRefund.mutateAsync({
            invoiceNumber: invoice.invoice_number,
            refundId: refundToRemove.id,
            deletionReason: deletionReason.trim() || undefined,
        })
        setRefundToRemove(null)
        setDeletionReason('')
    }

    const cancelRemoveRefund = () => {
        setRefundToRemove(null)
        setDeletionReason('')
    }

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cash: 'Cash',
            credit_card: 'Credit Card',
            debit: 'Debit',
            bank_transfer: 'Bank Transfer',
            check: 'Check',
            other: 'Other'
        }
        return labels[method] || method
    }

    return (
        <>
            <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            Payments
                        </CardTitle>
                        <div className="flex gap-2">
                            {canIssueRefund && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsRefundDialogOpen(true)}
                                    className="border-orange-400 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Issue Refund
                                </Button>
                            )}
                            {canAddPayment && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsAddDialogOpen(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Payment
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Payment Summary */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">Total Amount:</span>
                            <span className="text-sm font-medium text-foreground dark:text-white">
                                {formatCurrency(invoice.total_amount)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">Amount Paid:</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(amountPaid)}
                            </span>
                        </div>
                        {totalRefunded > 0 && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">Total Refunded:</span>
                                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                        -{formatCurrency(totalRefunded)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-border dark:border-[#333] pt-2">
                                    <span className="text-sm font-medium text-foreground dark:text-white">Net Paid:</span>
                                    <span className="text-sm font-semibold text-foreground dark:text-white">
                                        {formatCurrency(netPaid)}
                                    </span>
                                </div>
                            </>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">Outstanding:</span>
                            <span className={`text-sm font-semibold ${
                                outstanding > 0
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-green-600 dark:text-green-400'
                            }`}>
                                {formatCurrency(outstanding)}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        {invoice.total_amount > 0 && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                                    <span>Payment Progress</span>
                                    <span>{paymentProgress.toFixed(0)}%</span>
                                </div>
                                <Progress
                                    value={paymentProgress}
                                    className="h-2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Payment History */}
                    {payments.length > 0 ? (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-white">
                                Payment History
                            </h4>
                            <div className="space-y-2">
                                {payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 bg-background dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CreditCard className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                                                <span className="font-medium text-foreground dark:text-white">
                                                    {formatCurrency(payment.amount)}
                                                </span>
                                                <Badge variant="outline" className="text-xs">
                                                    {getPaymentMethodLabel(payment.payment_method)}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-0.5">
                                                <div>
                                                    {format(new Date(payment.payment_date.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
                                                </div>
                                                {payment.payment_reference && (
                                                    <div>Ref: {payment.payment_reference}</div>
                                                )}
                                                {payment.notes && (
                                                    <div>{payment.notes}</div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemovePayment(payment)}
                                            disabled={removePayment.isPending}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground dark:text-gray-400">
                            No payments recorded yet
                        </div>
                    )}

                    {/* Refunds */}
                    {refunds.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Refunds
                            </h4>
                            <div className="space-y-2">
                                {refunds.map((refund) => (
                                    <div
                                        key={refund.id}
                                        className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-500/5 rounded-lg border border-orange-200 dark:border-orange-500/20"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <RotateCcw className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                                <span className="font-medium text-orange-700 dark:text-orange-300">
                                                    -{formatCurrency(refund.amount)}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-400"
                                                >
                                                    {getPaymentMethodLabel(refund.refund_method)}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-400 space-y-0.5">
                                                <div>
                                                    {format(new Date(refund.refund_date.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
                                                </div>
                                                <div className="text-orange-600 dark:text-orange-400">
                                                    {refund.reason}
                                                </div>
                                                {refund.notes && <div>{refund.notes}</div>}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveRefund(refund)}
                                            disabled={removeRefund.isPending}
                                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Payment Dialog */}
            <AddPaymentDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                invoiceNumber={invoice.invoice_number}
                outstandingBalance={outstanding}
                totalAmount={invoice.total_amount}
            />

            {/* Add Refund Dialog */}
            <AddRefundDialog
                isOpen={isRefundDialogOpen}
                onClose={() => setIsRefundDialogOpen(false)}
                invoiceNumber={invoice.invoice_number}
                maxRefundable={maxRefundable}
            />

            {/* Remove Payment Confirmation Dialog */}
            <Dialog open={!!paymentToRemove} onOpenChange={(open) => !open && cancelRemovePayment()}>
                <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-foreground">
                            <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            Archive Payment
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            This payment will be archived and removed from the invoice balance.
                        </DialogDescription>
                    </DialogHeader>

                    {paymentToRemove && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-background rounded-lg p-4 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold text-foreground">
                                        {formatCurrency(paymentToRemove.amount)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {getPaymentMethodLabel(paymentToRemove.payment_method)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {format(new Date(paymentToRemove.payment_date.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deletion-reason" className="text-foreground">
                                    Reason for removal (optional)
                                </Label>
                                <Input
                                    id="deletion-reason"
                                    value={deletionReason}
                                    onChange={(e) => setDeletionReason(e.target.value)}
                                    placeholder="e.g., Customer refund, incorrect entry..."
                                    className="bg-white dark:bg-background border-border text-foreground"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 rounded-lg p-3">
                                <p className="text-blue-600 dark:text-blue-300 text-sm">
                                    The payment record will be kept for audit purposes but removed from the active balance.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={cancelRemovePayment}
                            disabled={removePayment.isPending}
                            className="border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmRemovePayment}
                            disabled={removePayment.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {removePayment.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Archiving...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Archive Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Refund Confirmation Dialog */}
            <Dialog open={!!refundToRemove} onOpenChange={(open) => !open && cancelRemoveRefund()}>
                <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-foreground">
                            <div className="flex items-center justify-center w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            Remove Refund
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            This refund will be removed. The invoice balance will be recalculated.
                        </DialogDescription>
                    </DialogHeader>

                    {refundToRemove && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-background rounded-lg p-4 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <RotateCcw className="h-4 w-4 text-orange-500" />
                                    <span className="font-semibold text-foreground">
                                        -{formatCurrency(refundToRemove.amount)}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {getPaymentMethodLabel(refundToRemove.refund_method)}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {format(new Date(refundToRemove.refund_date.slice(0, 10) + 'T00:00:00'), 'MMM d, yyyy')}
                                </div>
                                <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                    {refundToRemove.reason}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="refund-deletion-reason" className="text-foreground">
                                    Reason for removal (optional)
                                </Label>
                                <Input
                                    id="refund-deletion-reason"
                                    value={deletionReason}
                                    onChange={(e) => setDeletionReason(e.target.value)}
                                    placeholder="e.g., Entered in error..."
                                    className="bg-white dark:bg-background border-border text-foreground"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={cancelRemoveRefund}
                            disabled={removeRefund.isPending}
                            className="border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmRemoveRefund}
                            disabled={removeRefund.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {removeRefund.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Refund
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
