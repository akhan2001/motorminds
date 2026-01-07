'use client'

import React, { useRef } from 'react'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface InvoiceSyncWarningDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    amountPaid: number
    totalAmount: number
    isSyncing: boolean
}

export function InvoiceSyncWarningDialog({
    isOpen,
    onClose,
    onConfirm,
    amountPaid,
    totalAmount,
    isSyncing
}: InvoiceSyncWarningDialogProps) {
    // Track if confirm was clicked to prevent onClose from being called
    const isConfirmingRef = useRef(false)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const handleConfirmClick = () => {
        isConfirmingRef.current = true
        onConfirm()
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && !isConfirmingRef.current) {
            onClose()
        }
        // Reset the ref when dialog closes
        if (!open) {
            isConfirmingRef.current = false
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <AlertDialogTitle>Invoice Has Payments</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="pt-2 space-y-3 text-sm text-muted-foreground">
                            <p>
                                This work order has an invoice with recorded payments. Syncing will update the invoice
                                totals based on the current work order items.
                            </p>
                            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                                <div className="flex justify-between">
                                    <span>Current invoice total:</span>
                                    <span className="font-medium text-foreground">{formatCurrency(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Amount paid:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(amountPaid)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-amber-600 dark:text-amber-400">
                                The outstanding balance will be recalculated after sync.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={isSyncing}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        onClick={handleConfirmClick}
                        disabled={isSyncing}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            'Sync & Complete'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

