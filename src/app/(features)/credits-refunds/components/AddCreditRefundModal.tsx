'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog'
import SupplierDropdownSelector from '@/app/(features)/suppliers/components/supplier-dropdown-selector'
import { getSupplierName } from '@/app/(features)/suppliers/components/supplier-dropdown-selector'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { useCreateCreditRefund } from '../hooks/use-credits-refunds'
import type { CreateCreditRefundRequest } from '../types/credits-refunds'
import { getTorontoDateString } from '@/lib/utils/date'

interface AddCreditRefundModalProps {
    shopId: string
    onCreditRefundAdded?: () => void
    children: React.ReactNode
}

export default function AddCreditRefundModal({
    shopId,
    onCreditRefundAdded,
    children,
}: AddCreditRefundModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [supplierId, setSupplierId] = useState('')
    const [customSupplier, setCustomSupplier] = useState('')
    const [refundDate, setRefundDate] = useState(getTorontoDateString())
    const [notes, setNotes] = useState('')
    const [description, setDescription] = useState('')
    const [partNumber, setPartNumber] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [partsDescription, setPartsDescription] = useState('')
    const [error, setError] = useState('')

    const { suppliers } = useSuppliers()
    const createCreditRefund = useCreateCreditRefund()

    const getSupplierNameValue = (): string | null => {
        if (supplierId === 'custom') {
            return customSupplier.trim() || null
        }
        return getSupplierName(suppliers, supplierId) || null
    }

    const resetForm = () => {
        setAmount('')
        setReason('')
        setSupplierId('')
        setCustomSupplier('')
        setRefundDate(getTorontoDateString())
        setNotes('')
        setDescription('')
        setPartNumber('')
        setInvoiceNumber('')
        setPartsDescription('')
        setError('')
    }

    const handleSubmit = async () => {
        setError('')

        if (!reason.trim()) {
            setError('Reason is required.')
            return
        }
        const amountNum = parseFloat(amount)
        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount greater than 0.')
            return
        }
        if (!refundDate) {
            setError('Please select a date.')
            return
        }
        if (!description.trim()) {
            setError('Description is required (e.g., part name, return reason).')
            return
        }

        const data: CreateCreditRefundRequest = {
            shop_id: shopId,
            amount: amountNum,
            supplier: getSupplierNameValue(),
            supplier_id: supplierId && supplierId !== 'custom' ? supplierId : null,
            reason: reason.trim(),
            refund_date: refundDate,
            notes: notes.trim() || null,
            description: description.trim() || null,
            part_number: partNumber.trim() || null,
            invoice_number: invoiceNumber.trim() || null,
            parts_description: partsDescription.trim() || null,
        }

        try {
            await createCreditRefund.mutateAsync(data)
            resetForm()
            onCreditRefundAdded?.()
            setIsOpen(false)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create credit/refund')
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) setError('')
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-foreground">Add Credit/Refund</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Record money flowing back into the business (supplier credits, refunds).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto min-h-0 flex-1 pr-2">
                    <div>
                        <Label className="text-foreground">Supplier</Label>
                        <SupplierDropdownSelector
                            value={supplierId}
                            onValueChange={setSupplierId}
                            placeholder="Select a supplier..."
                            showCustomOption={true}
                            customOptionValue="custom"
                            customOptionLabel="Enter Custom Supplier"
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    {supplierId === 'custom' && (
                        <div>
                            <Label htmlFor="customSupplier" className="text-foreground">
                                Custom Supplier Name
                            </Label>
                            <Input
                                id="customSupplier"
                                placeholder="e.g., AutoZone, O'Reilly"
                                value={customSupplier}
                                onChange={(e) => setCustomSupplier(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground mt-1"
                            />
                        </div>
                    )}

                    <div>
                        <Label htmlFor="reason" className="text-foreground">
                            Reason *
                        </Label>
                        <Input
                            id="reason"
                            placeholder="e.g., Returned parts, Warranty credit"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="amount" className="text-foreground">
                            Amount *
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-foreground">
                            Description *
                        </Label>
                        <Input
                            id="description"
                            placeholder="e.g., Brake pads return, Warranty credit on alternator"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="partNumber" className="text-foreground">
                            Part #
                        </Label>
                        <Input
                            id="partNumber"
                            placeholder="e.g., BP-12345"
                            value={partNumber}
                            onChange={(e) => setPartNumber(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="invoiceNumber" className="text-foreground">
                            Invoice #
                        </Label>
                        <Input
                            id="invoiceNumber"
                            placeholder="e.g., INV-2024-001"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="partsDescription" className="text-foreground">
                            Parts description
                        </Label>
                        <Textarea
                            id="partsDescription"
                            placeholder="Additional details about the part(s)..."
                            value={partsDescription}
                            onChange={(e) => setPartsDescription(e.target.value)}
                            rows={2}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="refundDate" className="text-foreground">
                            Date *
                        </Label>
                        <Input
                            id="refundDate"
                            type="date"
                            value={refundDate}
                            onChange={(e) => setRefundDate(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes" className="text-foreground">
                            Notes
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional details..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="bg-white dark:bg-background border-border text-foreground mt-1"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                </div>
                <DialogFooter className="shrink-0">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            createCreditRefund.isPending ||
                            !reason.trim() ||
                            !amount ||
                            parseFloat(amount) <= 0 ||
                            !description.trim()
                        }
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {createCreditRefund.isPending ? 'Saving...' : 'Add Credit/Refund'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
