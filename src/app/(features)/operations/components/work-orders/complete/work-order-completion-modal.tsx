import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Car, User, Phone, FileText, ExternalLink, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { useWorkOrderCompletionTemplates } from '../../../hooks/use-active-automated-messages'
import { formatDelayHours } from '@/app/(features)/messaging/types/message-template'
import type { WorkOrderCompletionModalProps } from '../../../types/work-order-messaging'

export const WorkOrderCompletionModal: React.FC<WorkOrderCompletionModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onConfirm,
    generatedInvoiceNumber,
    // Drag-to-complete flow props
    onGenerateAndGoToInvoice,
    onGenerateAndComplete,
    isGenerating = false
}) => {
    const router = useRouter()
    const [enableAutomatedMessage, setEnableAutomatedMessage] = useState(true)
    
    // Fetch active automated message templates
    const { templates: automatedTemplates, isLoading: loadingTemplates } = useWorkOrderCompletionTemplates(isOpen)
    
    // Determine which flow we're in
    const isDragToCompleteFlow = !!(onGenerateAndGoToInvoice && onGenerateAndComplete)
    
    // Show button if work order has invoice_id OR if an invoice was just generated
    const hasInvoice = !!workOrder.invoice_id || !!generatedInvoiceNumber
    const invoiceNumber = workOrder.invoice_id || generatedInvoiceNumber

    const handleCompleteWithoutInvoice = () => {
        // No message sent, no invoice generated
        onConfirm(false, undefined, enableAutomatedMessage, false)
        // Modal will be closed by parent after completion
    }

    const handleCompleteWithInvoice = () => {
        // No message sent, invoice generated
        // Don't close modal here - parent will keep it open to show "Go to Invoice" button
        onConfirm(false, undefined, enableAutomatedMessage, true)
    }

    const handleGoToInvoice = () => {
        if (invoiceNumber) {
            router.push(`/financials/invoices?invoice_number=${invoiceNumber}`)
            onClose()
        }
    }
    
    // Drag-to-complete flow handlers
    const handleGenerateAndGoToInvoice = async () => {
        if (onGenerateAndGoToInvoice) {
            await onGenerateAndGoToInvoice()
            onClose()
        }
    }

    const handleGenerateAndComplete = async () => {
        if (onGenerateAndComplete) {
            await onGenerateAndComplete()
            onClose()
        }
    }

    const vehicleInfo = workOrder.vehicle ? 
        `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
        'Vehicle information not available'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <Car className="h-5 w-5 text-green-500" />
                        Work Order Completed
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        Complete the work order and optionally generate an invoice.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
                    {/* Work Order Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground dark:text-gray-300">Work Order Summary</h3>
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-foreground dark:text-white">{workOrder.title}</span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/20">
                                    Completed
                                </Badge>
                            </div>
                            {workOrder.description && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400">{workOrder.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                <p className="text-foreground dark:text-white font-medium">{workOrder.customer?.customer_name || 'Unknown'}</p>
                                {workOrder.customer?.customer_phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(workOrder.customer.customer_phone)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                <p className="text-foreground dark:text-white font-medium">{vehicleInfo}</p>
                                {workOrder.vehicle?.license_plate && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        License: {workOrder.vehicle.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Automated Follow-Up Toggle */}
                    <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                <div>
                                    <Label htmlFor="automated-message" className="text-sm font-medium text-foreground dark:text-white cursor-pointer">
                                        Send automated follow-up messages
                                    </Label>
                                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
                                        Automatically schedules follow-up messages based on your active templates
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="automated-message"
                                checked={enableAutomatedMessage}
                                onCheckedChange={setEnableAutomatedMessage}
                                disabled={automatedTemplates.length === 0}
                            />
                        </div>

                        {/* Show which templates will be triggered */}
                        {enableAutomatedMessage && (
                            <div className="mt-3 pt-3 border-t border-blue-500/20">
                                {loadingTemplates ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Loading templates...
                                    </div>
                                ) : automatedTemplates.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-foreground dark:text-gray-300">
                                            {automatedTemplates.length} message{automatedTemplates.length !== 1 ? 's' : ''} will be scheduled:
                                        </p>
                                        <div className="space-y-1.5">
                                            {automatedTemplates.map((template) => (
                                                <div 
                                                    key={template.id} 
                                                    className="flex items-start gap-2 text-xs bg-blue-500/5 rounded px-2 py-1.5"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <span className="font-medium text-foreground dark:text-white">
                                                            {template.name}
                                                        </span>
                                                        <span className="text-muted-foreground dark:text-gray-400">
                                                            {' '} - Sends in {formatDelayHours(template.delay_hours)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                        <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                        <p>
                                            No active templates found. Create templates in{' '}
                                            <a 
                                                href="/messaging/automated" 
                                                className="underline hover:text-amber-700 dark:hover:text-amber-300"
                                                target="_blank"
                                            >
                                                Messaging Settings
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 flex gap-3 pt-4 border-t border-border dark:border-[#2a2a2a]">
                    {isDragToCompleteFlow ? (
                        // Drag-to-complete flow: Show generate invoice options
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={isGenerating}
                                className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerateAndComplete}
                                disabled={isGenerating}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4 mr-2" />
                                )}
                                Complete With Invoice
                            </Button>
                            <Button
                                onClick={handleGenerateAndGoToInvoice}
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                )}
                                Complete & Go to Invoice
                            </Button>
                        </>
                    ) : hasInvoice ? (
                        // Invoice already generated: Show close and go to invoice
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={handleGoToInvoice}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Go to Invoice
                            </Button>
                        </>
                    ) : (
                        // Standard completion flow: Choose to generate invoice or not
                        <>
                            <Button
                                variant="outline"
                                onClick={handleCompleteWithoutInvoice}
                                className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white"
                            >
                                Complete Without Invoice
                            </Button>
                            
                            <Button
                                onClick={handleCompleteWithInvoice}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Complete With Invoice
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
