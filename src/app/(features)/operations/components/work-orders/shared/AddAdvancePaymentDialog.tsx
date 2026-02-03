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
import { useAddWorkOrderAdvancePayment } from '../../../hooks/use-work-order-advance-payments'
import type { PaymentMethod } from '../../../../financials/types/invoice'
import { formatCurrency } from '@/lib/utils/currency'
import { getTorontoDateString, getTorontoDayBoundsUTC } from '@/lib/utils/date'

interface AddAdvancePaymentDialogProps {
    isOpen: boolean
    onClose: () => void
    workOrderId: string
    estimatedTotal?: number
    totalAdvancePaid?: number
}

export function AddAdvancePaymentDialog({
    isOpen,
    onClose,
    workOrderId,
    estimatedTotal = 0,
    totalAdvancePaid = 0
}: AddAdvancePaymentDialogProps) {
    const [amount, setAmount] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
    const [paymentDate, setPaymentDate] = useState<string>(getTorontoDateString())
    const [paymentReference, setPaymentReference] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    
    const addPayment = useAddWorkOrderAdvancePayment()

    // Reset form when dialog opens (use Toronto date so default matches daily report / financial timezone)
    useEffect(() => {
        if (isOpen) {
            setPaymentDate(getTorontoDateString())
            setAmount('')
            setPaymentMethod('')
            setPaymentReference('')
            setNotes('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const paymentAmount = parseFloat(amount)
        
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return
        }

        // Calculate remaining balance (estimated total - already paid)
        const currentRemainingBalance = estimatedTotal > 0 ? estimatedTotal - totalAdvancePaid : 0
        
        // Validate that payment doesn't exceed remaining balance
        // Use tolerance for floating-point comparison (allow up to 0.01 cents over for rounding)
        if (estimatedTotal > 0) {
            const exceedsBalance = paymentAmount > 0 && (paymentAmount - currentRemainingBalance > 0.01)
            if (exceedsBalance) {
                return
            }
        }

        if (!paymentMethod) {
            return
        }

        try {
            // Use start of selected day in Toronto so daily report attributes payment to the correct date
            const paymentDateISO = getTorontoDayBoundsUTC(paymentDate).start

            await addPayment.mutateAsync({
                workOrderId,
                payment: {
                    amount: paymentAmount,
                    payment_method: paymentMethod as PaymentMethod,
                    payment_date: paymentDateISO,
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

    // Calculate remaining balance (estimated total - already paid)
    const remainingBalance = estimatedTotal > 0 ? estimatedTotal - totalAdvancePaid : 0

    const handleFullPayment = () => {
        if (remainingBalance > 0) {
            setAmount(remainingBalance.toFixed(2))
        }
    }

    const amountValue = parseFloat(amount) || 0
    
    // Validation: amount must be > 0 and <= remaining balance (with tolerance for floating-point)
    // Allow up to 0.01 cents over remaining balance for rounding precision
    const isWithinBalance = estimatedTotal > 0
        ? (amountValue > 0 && (amountValue <= remainingBalance || (amountValue - remainingBalance) <= 0.01))
        : amountValue > 0
    
    const isValid = (
        isWithinBalance &&
        paymentMethod !== '' &&
        !addPayment.isPending
    )

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] flex flex-col [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>Add Advance Payment</DialogTitle>
                    <DialogDescription>
                        Record an advance payment for this work order. This payment will be carried forward to the invoice when created.
                        {estimatedTotal > 0 && ` Remaining balance: ${formatCurrency(remainingBalance)}`}
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
                                    min="0.01"
                                    max={estimatedTotal > 0 ? remainingBalance + 0.01 : undefined}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="flex-1"
                                />
                                {estimatedTotal > 0 && remainingBalance > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleFullPayment}
                                        disabled={remainingBalance <= 0}
                                    >
                                        Full
                                    </Button>
                                )}
                            </div>
                            {estimatedTotal > 0 && amountValue > 0 && (amountValue - remainingBalance > 0.01) && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Amount cannot exceed remaining balance of {formatCurrency(remainingBalance)}
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
                                placeholder="Additional notes about this advance payment"
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
