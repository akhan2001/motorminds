'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, FileText } from 'lucide-react'
import type { WorkOrderWithDetails } from '../../../types/work-order'

interface WorkOrderSendChoiceModalProps {
    workOrder: WorkOrderWithDetails
    isOpen: boolean
    onClose: () => void
    onEmailChoice: () => void
    onSmsChoice: () => void
}

export const WorkOrderSendChoiceModal: React.FC<WorkOrderSendChoiceModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onEmailChoice,
    onSmsChoice,
}) => {
    const isWalkIn = workOrder.customer_type === 'walk_in' || !workOrder.customer
    const customerHasEmail = !isWalkIn && !!workOrder.customer?.customer_email
    const customerHasPhone = !isWalkIn && !!workOrder.customer?.customer_phone
    const customerName = workOrder.customer?.customer_name || 'Walk-in Customer'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Send Document
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        {isWalkIn
                            ? 'Walk-in customers do not have contact information on file. Please send the document manually.'
                            : `Choose how you'd like to send this document to ${customerName}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <Button
                        className="h-24 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white border border-border dark:border-[#333333] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onEmailChoice}
                        disabled={!customerHasEmail || isWalkIn}
                    >
                        <span className="grid gap-1 text-center">
                            <Mail size="28" className={`mx-auto ${customerHasEmail ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground dark:text-gray-500'}`} />
                            <span className="text-base">Email</span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">
                                {isWalkIn ? 'Not available for walk-in' : customerHasEmail ? workOrder.customer?.customer_email : 'No email on file'}
                            </span>
                        </span>
                    </Button>

                    <Button
                        className="h-24 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white border border-border dark:border-[#333333] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onSmsChoice}
                        disabled={!customerHasPhone || isWalkIn}
                    >
                        <span className="grid gap-1 text-center">
                            <MessageSquare size="28" className={`mx-auto ${customerHasPhone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground dark:text-gray-500'}`} />
                            <span className="text-base">SMS</span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">
                                {isWalkIn ? 'Not available for walk-in' : customerHasPhone ? workOrder.customer?.customer_phone : 'No phone on file'}
                            </span>
                        </span>
                    </Button>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-border dark:border-[#333333] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
