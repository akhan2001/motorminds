'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RevertWorkOrderDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    workOrderTitle?: string
    hasInvoice?: boolean
    warningMessage?: string
    isReverting?: boolean
}

export function RevertWorkOrderDialog({
    isOpen,
    onClose,
    onConfirm,
    workOrderTitle,
    hasInvoice = false,
    warningMessage,
    isReverting = false
}: RevertWorkOrderDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#1a1a1a]">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Revert Work Order
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Confirm reverting work order from completed to in-progress
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <p className="text-sm text-foreground">
                        Are you sure you want to revert this completed work order back to <strong>In Progress</strong>?
                    </p>
                    
                    {workOrderTitle && (
                        <div className="text-sm text-muted-foreground">
                            <strong>Work Order:</strong> {workOrderTitle}
                        </div>
                    )}

                    {hasInvoice && (
                        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                                This work order has an invoice. Reverting may require invoice adjustments.
                            </AlertDescription>
                        </Alert>
                    )}

                    {warningMessage && (
                        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                                {warningMessage}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>• The completion timestamp will be cleared</p>
                        <p>• The work order will become editable again</p>
                        <p>• No automated messages will be sent</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isReverting}
                        className="bg-white dark:bg-[#1a1a1a] text-foreground border-border"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isReverting}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                        {isReverting ? 'Reverting...' : 'Revert to In Progress'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

