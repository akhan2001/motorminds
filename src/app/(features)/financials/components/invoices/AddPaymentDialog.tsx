'use client'

import React, { useState } from 'react'
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
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [paymentReference, setPaymentReference] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    
    const addPayment = useAddInvoicePayment()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return
        }

        if (paymentAmount > outstandingBalance) {
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
                    payment_date: new Date(paymentDate).toISOString(),
                    payment_reference: paymentReference || null,
                    notes: notes || null,
                }
            })
            
            // Reset form
            setAmount('')
            setPaymentMethod('')
            setPaymentDate(new Date().toISOString().split('T')[0])
            setPaymentReference('')
            setNotes('')
        } catch (error) {
            // Error is handled by the mutation
        }
    }

    const handleClose = () => {
        if (!addPayment.isPending) {
            setAmount('')
            setPaymentMethod('')
            setPaymentDate(new Date().toISOString().split('T')[0])
            setPaymentReference('')
            setNotes('')
            onClose()
        }
    }

    const handleFullPayment = () => {
        setAmount(outstandingBalance.toFixed(2))
    }

    const amountValue = parseFloat(amount) || 0
    const isValid = amountValue > 0 && 
                   amountValue <= outstandingBalance && 
                   paymentMethod !== '' &&
                   !addPayment.isPending

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] flex flex-col [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                        Record a payment for this invoice. Outstanding balance: {formatCurrency(outstandingBalance)}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
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
                                    max={outstandingBalance}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="flex-1"
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
                            {amountValue > outstandingBalance && (
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

