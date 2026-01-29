'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Trash2, DollarSign, CreditCard, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { Payment } from '../../../../financials/types/invoice'
import { useAddWorkOrderAdvancePayment, useRemoveWorkOrderAdvancePayment } from '../../../hooks/use-work-order-advance-payments'
import { AddAdvancePaymentDialog } from './AddAdvancePaymentDialog'
import { calculateInvoiceTotals } from '../../../../financials/lib/invoice-calculations'
import type { WorkOrderItem } from '../../../types/work-order-items'

interface WorkOrderAdvancePaymentsSectionProps {
    workOrder: WorkOrderWithDetails
    workOrderItems?: WorkOrderItem[]
    isEditing?: boolean
}

export function WorkOrderAdvancePaymentsSection({ 
    workOrder, 
    workOrderItems = [],
    isEditing = false 
}: WorkOrderAdvancePaymentsSectionProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [paymentToRemove, setPaymentToRemove] = useState<Payment | null>(null)
    const [deletionReason, setDeletionReason] = useState('')
    const addPayment = useAddWorkOrderAdvancePayment()
    const removePayment = useRemoveWorkOrderAdvancePayment()

    const allPayments = (workOrder.advance_payments || []) as Payment[]
    // Filter out deleted/archived payments for display
    const payments = allPayments.filter(p => !p.deleted)
    
    // Calculate total amount from work order items
    const billableItems = workOrderItems.filter(item => item.is_billable !== false)
    const calculations = calculateInvoiceTotals(billableItems as any)
    const estimatedTotal = calculations.subtotal + (calculations.subtotal * 0.13) // Add tax estimate
    
    // Calculate total advance payments
    const totalAdvancePaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

    const handleRemovePayment = (payment: Payment) => {
        setPaymentToRemove(payment)
        setDeletionReason('')
    }

    const confirmRemovePayment = async () => {
        if (!paymentToRemove) return
        
        await removePayment.mutateAsync({
            workOrderId: workOrder.id,
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

    // Only show if work order hasn't been invoiced yet
    const hasInvoice = !!workOrder.invoice_id
    if (hasInvoice) {
        return null // Don't show advance payments section if invoice already exists
    }

    return (
        <>
            <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                            Advance Payments
                        </CardTitle>
                        {isEditing && (
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
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Payment Summary */}
                    <div className="space-y-3">
                        {estimatedTotal > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground dark:text-gray-400">Estimated Total:</span>
                                <span className="text-sm font-medium text-foreground dark:text-white">
                                    {formatCurrency(estimatedTotal)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">Advance Paid:</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(totalAdvancePaid)}
                            </span>
                        </div>
                        {estimatedTotal > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground dark:text-gray-400">Remaining:</span>
                                <span className={`text-sm font-semibold ${
                                    (estimatedTotal - totalAdvancePaid) > 0 
                                        ? 'text-orange-600 dark:text-orange-400' 
                                        : 'text-green-600 dark:text-green-400'
                                }`}>
                                    {formatCurrency(Math.max(0, estimatedTotal - totalAdvancePaid))}
                                </span>
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
                                                    {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                                </div>
                                                {payment.payment_reference && (
                                                    <div>
                                                        Ref: {payment.payment_reference}
                                                    </div>
                                                )}
                                                {payment.notes && (
                                                    <div>
                                                        {payment.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isEditing && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemovePayment(payment)}
                                                disabled={removePayment.isPending}
                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground dark:text-gray-400">
                            No advance payments recorded yet
                            {estimatedTotal > 0 && (
                                <div className="mt-1 text-xs">
                                    These payments will be carried forward to the invoice when created.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Payment Dialog */}
            <AddAdvancePaymentDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                workOrderId={workOrder.id}
                estimatedTotal={estimatedTotal}
                totalAdvancePaid={totalAdvancePaid}
            />

            {/* Remove Payment Confirmation Dialog */}
            <Dialog open={!!paymentToRemove} onOpenChange={(open) => !open && cancelRemovePayment()}>
                <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-foreground">
                            <div className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            Archive Advance Payment
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            This advance payment will be archived. It will not be carried forward to the invoice.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {paymentToRemove && (
                            <div className="p-3 bg-background dark:bg-[#0f0f0f] rounded-lg border border-border">
                                <div className="text-sm font-medium text-foreground dark:text-white mb-1">
                                    {formatCurrency(paymentToRemove.amount)}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                    {format(new Date(paymentToRemove.payment_date), 'MMM d, yyyy')} • {getPaymentMethodLabel(paymentToRemove.payment_method)}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="deletionReason">Reason (Optional)</Label>
                            <Input
                                id="deletionReason"
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Reason for archiving this payment"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={cancelRemovePayment}
                            disabled={removePayment.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmRemovePayment}
                            disabled={removePayment.isPending}
                        >
                            {removePayment.isPending ? 'Archiving...' : 'Archive Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
