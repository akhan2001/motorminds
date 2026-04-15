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
import { useAddInvoiceRefund } from '../../hooks/use-invoice-payments'
import type { PaymentMethod } from '../../types/invoice'
import { formatCurrency } from '@/lib/utils/currency'
import { getTorontoDateString } from '@/lib/utils/date'

interface AddRefundDialogProps {
    isOpen: boolean
    onClose: () => void
    invoiceNumber: string
    /** amount_paid - total_refunded: the maximum that can still be refunded */
    maxRefundable: number
}

export function AddRefundDialog({
    isOpen,
    onClose,
    invoiceNumber,
    maxRefundable,
}: AddRefundDialogProps) {
    const [amount, setAmount] = useState<string>('')
    const [refundMethod, setRefundMethod] = useState<PaymentMethod | ''>('')
    const [refundDate, setRefundDate] = useState<string>(getTorontoDateString())
    const [reason, setReason] = useState<string>('')
    const [notes, setNotes] = useState<string>('')

    const addRefund = useAddInvoiceRefund()

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setAmount('')
            setRefundMethod('')
            setRefundDate(getTorontoDateString())
            setReason('')
            setNotes('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const refundAmount = parseFloat(amount)
        if (isNaN(refundAmount) || refundAmount <= 0) return
        if ((refundAmount - maxRefundable) > 0.01) return
        if (!refundMethod) return
        if (!reason.trim()) return

        try {
            await addRefund.mutateAsync({
                invoiceNumber,
                refund: {
                    amount: refundAmount,
                    refund_method: refundMethod as PaymentMethod,
                    refund_date: refundDate,
                    reason: reason.trim(),
                    notes: notes.trim() || null,
                },
            })

            onClose()
        } catch {
            // Error handled by hook toast
        }
    }

    const handleClose = () => {
        if (!addRefund.isPending) {
            onClose()
        }
    }

    const handleFullRefund = () => {
        setAmount(maxRefundable.toFixed(2))
    }

    const amountValue = parseFloat(amount) || 0
    const exceedsMax = amountValue > 0 && (amountValue - maxRefundable) > 0.01

    const isValid =
        amountValue > 0 &&
        !exceedsMax &&
        refundMethod !== '' &&
        reason.trim() !== '' &&
        !addRefund.isPending

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] flex flex-col [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>Issue Refund</DialogTitle>
                    <DialogDescription>
                        Refundable amount: {formatCurrency(maxRefundable)}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-4 py-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-amount">Amount *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="refund-amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={maxRefundable + 0.01}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleFullRefund}
                                    disabled={maxRefundable <= 0}
                                >
                                    Full
                                </Button>
                            </div>
                            {exceedsMax && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Amount cannot exceed refundable balance of {formatCurrency(maxRefundable)}
                                </p>
                            )}
                        </div>

                        {/* Refund Method */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-method">Refund Method *</Label>
                            <Select
                                value={refundMethod}
                                onValueChange={(value) => setRefundMethod(value as PaymentMethod)}
                                required
                            >
                                <SelectTrigger id="refund-method">
                                    <SelectValue placeholder="Select refund method" />
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

                        {/* Refund Date */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-date">Refund Date *</Label>
                            <Input
                                id="refund-date"
                                type="date"
                                value={refundDate}
                                onChange={(e) => setRefundDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-reason">Reason *</Label>
                            <Input
                                id="refund-reason"
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Duplicate charge, Service not completed"
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-notes">Notes</Label>
                            <Textarea
                                id="refund-notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional details about this refund"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={addRefund.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {addRefund.isPending ? 'Issuing...' : 'Issue Refund'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
