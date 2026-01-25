'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, CheckCircle } from 'lucide-react'
import type { WorkOrderWithDetails } from '../../../types/work-order'

interface WorkOrderCompleteInvoiceModalProps {
    workOrder: WorkOrderWithDetails
    isOpen: boolean
    onClose: () => void
    onGenerateAndGoToInvoice: () => Promise<void>
    onGenerateAndComplete: () => Promise<void>
    isGenerating?: boolean
}

export const WorkOrderCompleteInvoiceModal: React.FC<WorkOrderCompleteInvoiceModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onGenerateAndGoToInvoice,
    onGenerateAndComplete,
    isGenerating = false
}) => {
    const router = useRouter()

    const handleGenerateAndGoToInvoice = async () => {
        await onGenerateAndGoToInvoice()
        onClose()
    }

    const handleGenerateAndComplete = async () => {
        await onGenerateAndComplete()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-500" />
                        Complete Work Order
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        Generate an invoice for this work order and choose how to proceed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                        <p className="text-sm font-medium text-foreground dark:text-white mb-1">
                            {workOrder.title}
                        </p>
                        {workOrder.description && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                                {workOrder.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleGenerateAndGoToInvoice}
                            disabled={isGenerating}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-auto py-3 flex items-center justify-start gap-3"
                        >
                            <ExternalLink className="h-5 w-5" />
                            <div className="flex-1 text-left">
                                <div className="font-semibold">Generate Invoice and Go to Invoice</div>
                                <div className="text-xs opacity-90">Create invoice and navigate to view it</div>
                            </div>
                        </Button>

                        <Button
                            onClick={handleGenerateAndComplete}
                            disabled={isGenerating}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-auto py-3 flex items-center justify-start gap-3"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <div className="flex-1 text-left">
                                <div className="font-semibold">Generate Invoice and Mark Complete</div>
                                <div className="text-xs opacity-90">Create invoice and complete the work order</div>
                            </div>
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a]"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
