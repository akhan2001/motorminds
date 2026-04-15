'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAddInvoicePayment } from '../../hooks/use-invoice-payments'
import type { PaymentMethod } from '../../types/invoice'
import { formatCurrency } from '@/lib/utils/currency'
import { getTorontoDateString } from '@/lib/utils/date'

interface AddPaymentDialogProps {
    isOpen: boolean
    onClose: () => void
    invoiceNumber: string
    outstandingBalance: number
    totalAmount: number
}

export function AddPaymentDialog({
    isOpen,
    onClose,
    invoiceNumber,
    outstandingBalance,
    totalAmount
}: AddPaymentDialogProps) {
    const [amount, setAmount] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
    const [paymentDate, setPaymentDate] = useState<string>(getTorontoDateString())
    const [paymentReference, setPaymentReference] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    
    const addPayment = useAddInvoicePayment()

    // Reset form when dialog opens - ensure payment date is always today
    useEffect(() => {
        if (isOpen) {
            // Always reset payment date to current date when dialog opens
            setPaymentDate(getTorontoDateString())
            
            // Auto-set amount to 0 for $0 invoices
            if (totalAmount === 0) {
                setAmount('0')
            }
        }
    }, [isOpen, totalAmount])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const paymentAmount = parseFloat(amount)
        
        // Allow $0 payments for $0 invoices (for record-keeping purposes)
        const isZeroInvoice = totalAmount === 0
        if (isNaN(paymentAmount) || (paymentAmount < 0)) {
            return
        }
        
        // For non-zero invoices, payment must be > 0 and <= outstanding balance
        // Use tolerance for floating-point comparison (allow up to 0.01 cents over for rounding)
        const exceedsBalance = !isZeroInvoice && paymentAmount > 0 && (paymentAmount - outstandingBalance > 0.01)
        if (!isZeroInvoice && (paymentAmount <= 0 || exceedsBalance)) {
            return
        }

        // For zero invoices, only allow 0 or valid amounts
        if (isZeroInvoice && paymentAmount !== 0) {
            return
        }

        if (!paymentMethod) {
            return
        }

        try {
            await addPayment.mutateAsync({
                invoiceNumber,
                payment: {
                    amount: paymentAmount,
                    payment_method: paymentMethod as PaymentMethod,
                    payment_date: paymentDate,
                    payment_reference: paymentReference || null,
                    notes: notes || null,
                }
            })
            
            // Reset form
            setAmount('')
            setPaymentMethod('')
            setPaymentDate(getTorontoDateString())
            setPaymentReference('')
            setNotes('')
            
            // Close dialog immediately after successful payment
            onClose()
        } catch (error) {
            // Error is handled by the mutation - don't close dialog on error
        }
    }

    const handleClose = () => {
        if (!addPayment.isPending) {
            setAmount('')
            setPaymentMethod('')
            setPaymentDate(getTorontoDateString())
            setPaymentReference('')
            setNotes('')
            onClose()
        }
    }

    const handleFullPayment = () => {
        setAmount(outstandingBalance.toFixed(2))
    }

    const amountValue = parseFloat(amount) || 0
    const isZeroInvoice = totalAmount === 0
    
    // For $0 invoices, allow recording a $0 payment
    // For regular invoices, require amount > 0 and <= outstanding balance (with tolerance for floating-point)
    // Allow up to 0.01 cents over outstanding balance for rounding precision
    const isWithinBalance = isZeroInvoice 
        ? amountValue === 0 
        : (amountValue > 0 && (amountValue <= outstandingBalance || (amountValue - outstandingBalance) <= 0.01))
    
    const isValid = (
        isWithinBalance &&
        paymentMethod !== '' &&
        !addPayment.isPending
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] flex flex-col [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for this invoice. Outstanding balance: {formatCurrency(outstandingBalance)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4 py-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min={isZeroInvoice ? "0" : "0.01"}
                                    max={isZeroInvoice ? 0 : outstandingBalance + 0.01}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={isZeroInvoice ? "0.00" : "0.00"}
                                    required
                                    className="flex-1"
                                    disabled={isZeroInvoice}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleFullPayment}
                                    disabled={outstandingBalance <= 0}
                                >
                                    Full
                                </Button>
                            </div>
                            {isZeroInvoice && (
                                <p className="text-sm text-muted-foreground">
                                    This is a $0 invoice. Recording for tracking purposes.
                                </p>
                            )}
                            {!isZeroInvoice && amountValue > 0 && (amountValue - outstandingBalance > 0.01) && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Amount cannot exceed outstanding balance
                                </p>
                            )}
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Payment Method *</Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                                required
                            >
                                <SelectTrigger id="paymentMethod">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="debit">Debit</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentDate">Payment Date *</Label>
                            <Input
                                id="paymentDate"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Payment Reference */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentReference">Payment Reference</Label>
                            <Input
                                id="paymentReference"
                                type="text"
                                value={paymentReference}
                                onChange={(e) => setPaymentReference(e.target.value)}
                                placeholder="Transaction ID, check number, etc."
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes about this payment"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={addPayment.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {addPayment.isPending ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

