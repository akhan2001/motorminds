import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, FileText } from 'lucide-react'
import type { InvoiceWithDetails } from '../../types/invoice'

interface InvoiceSendChoiceModalProps {
    invoice: InvoiceWithDetails
    isOpen: boolean
    onClose: () => void
    onEmailChoice: () => void
    onSmsChoice: () => void
}

export const InvoiceSendChoiceModal: React.FC<InvoiceSendChoiceModalProps> = ({
    invoice,
    isOpen,
    onClose,
    onEmailChoice,
    onSmsChoice
}) => {
    const customerHasEmail = !!invoice.customer.customer_email
    const customerHasPhone = !!invoice.customer.customer_phone

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Send Invoice
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        Choose how you'd like to send the invoice to {invoice.customer.customer_name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <Button 
                        className="h-24 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white border border-border dark:border-[#333333] disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={onEmailChoice}
                        disabled={!customerHasEmail}
                    >
                        <span className="grid gap-1 text-center">
                            <Mail size="28" className={`mx-auto ${customerHasEmail ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground dark:text-gray-500'}`} />
                            <span className="text-base">Email</span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">
                                {customerHasEmail ? invoice.customer.customer_email : 'No email address'}
                            </span>
                        </span>
                    </Button>
                    
                    <Button 
                        className="h-24 bg-slate-50 dark:bg-[#1f1f1f] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-foreground dark:text-white border border-border dark:border-[#333333] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onSmsChoice}
                        disabled={!customerHasPhone}
                    >
                        <span className="grid gap-1 text-center">
                            <MessageSquare size="28" className={`mx-auto ${customerHasPhone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground dark:text-gray-500'}`} />
                            <span className="text-base">SMS</span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">
                                {customerHasPhone ? invoice.customer.customer_phone : 'No phone number'}
                            </span>
                        </span>
                    </Button>
                </div>

                <div className="flex justify-end pt-4">
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
