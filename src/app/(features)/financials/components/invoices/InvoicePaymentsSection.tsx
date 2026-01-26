'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Trash2, DollarSign, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { format } from 'date-fns'
import type { InvoiceWithDetails, Payment } from '../../types/invoice'
import { useAddInvoicePayment, useRemoveInvoicePayment } from '../../hooks/use-invoice-payments'
import { AddPaymentDialog } from './AddPaymentDialog'

interface InvoicePaymentsSectionProps {
    invoice: InvoiceWithDetails
}

export function InvoicePaymentsSection({ invoice }: InvoicePaymentsSectionProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const addPayment = useAddInvoicePayment()
    const removePayment = useRemoveInvoicePayment()

    const allPayments = (invoice.payments || []) as Payment[]
    // Filter out deleted/archived payments for display
    const payments = allPayments.filter(p => !p.deleted)
    
    // Calculate amount_paid from active payments as fallback if database value is incorrect
    // This ensures UI shows correct value even if database trigger didn't filter deleted payments
    const calculatedAmountPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const databaseAmountPaid = invoice.amount_paid || 0
    
    // Use calculated value if it differs significantly from database (indicates trigger issue)
    // Otherwise use database value (more efficient)
    const amountPaid = Math.abs(calculatedAmountPaid - databaseAmountPaid) > 0.01 
        ? calculatedAmountPaid 
        : databaseAmountPaid
    
    // Calculate outstanding balance using the corrected amountPaid
    // For draft invoices, outstanding balance should be total_amount if not calculated yet
    // For other invoices, calculate from total_amount - amountPaid (using corrected amountPaid)
    const outstanding = invoice.status === 'draft' && (invoice.outstanding_balance === undefined || invoice.outstanding_balance === 0)
        ? invoice.total_amount
        : Math.max(0, invoice.total_amount - amountPaid)
    const paymentProgress = invoice.total_amount > 0 
        ? (amountPaid / invoice.total_amount) * 100 
        : 0

    // Allow adding payment for $0 invoices that aren't marked as paid
    // For regular invoices, require outstanding balance > 0
    const isZeroInvoice = invoice.total_amount === 0
    const canAddPayment = (
        (isZeroInvoice 
            ? invoice.status !== 'paid' && payments.length === 0 // $0 invoices: can add payment if not already paid
            : outstanding > 0 // Regular invoices: require outstanding balance
        ) &&
        invoice.status !== 'cancelled' && 
        invoice.status !== 'refunded'
    )

    const handleRemovePayment = async (paymentId: string) => {
        if (confirm('Are you sure you want to remove this payment?')) {
            await removePayment.mutateAsync({
                invoiceNumber: invoice.invoice_number,
                paymentId
            })
        }
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
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemovePayment(payment.id)}
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
        </>
    )
}

