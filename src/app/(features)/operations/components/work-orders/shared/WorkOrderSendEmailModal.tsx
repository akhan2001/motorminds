'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Mail, User, Car, DollarSign, Loader2, Lock, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { prepareShopBrandingWithLogo } from '../../../../financials/lib/pdf/logo-utils'
import { useEmailAvailability } from '../../../../financials/hooks/use-invoice-send'
import { generateWorkOrderPDFBase64, getWorkOrderFilename } from '../../../lib/work-order-pdf-generator'
import { getWorkOrderDocumentLabel } from '../pdf/WorkOrderPDFTemplate'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'

interface WorkOrderSendEmailModalProps {
    workOrder: WorkOrderWithDetails
    workOrderItems?: WorkOrderItem[]
    isOpen: boolean
    onClose: () => void
    onConfirm: (sent: boolean) => void
}

export const WorkOrderSendEmailModal: React.FC<WorkOrderSendEmailModalProps> = ({
    workOrder,
    workOrderItems,
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { data: shopInfo, isLoading: isLoadingShop } = useShopInfo()
    const emailAvailability = useEmailAvailability()

    const isWalkIn = workOrder.customer_type === 'walk_in' || !workOrder.customer
    const customerHasEmail = !isWalkIn && !!workOrder.customer?.customer_email
    const documentLabel = getWorkOrderDocumentLabel(workOrder.status)

    const vehicleInfo = workOrder.vehicle
        ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}`
        : workOrder.walk_in_vehicle_info
            ? `${workOrder.walk_in_vehicle_info.year} ${workOrder.walk_in_vehicle_info.make} ${workOrder.walk_in_vehicle_info.model}`
            : undefined

    const billableItems = (workOrderItems ?? []).filter(
        item => item.item_type !== 'expense' && (item as any).active !== false
    )
    const subtotal = billableItems.reduce((sum, item) => {
        const qty = item.item_type === 'labor' ? (item.labor_hours || 0) : (item.quantity || 0)
        return sum + qty * (item.unit_price || 0)
    }, 0)
    const total = subtotal * 1.13

    useEffect(() => {
        if (isOpen && workOrder) {
            const customerName = workOrder.customer?.customer_name || 'Customer'
            const vehicle = vehicleInfo ? ` for your ${vehicleInfo}` : ''
            setCustomMessage(
                `Hi ${customerName},\n\nPlease find your ${documentLabel.toLowerCase()}${vehicle} attached to this email (Work Order #${workOrder.work_order_number}).\n\nIf you have any questions, please don't hesitate to reach out.\n\nThank you for your business!`
            )
        }
    }, [isOpen, workOrder])

    const handleSend = async () => {
        if (!customerHasEmail || !shopInfo) return

        setIsLoading(true)
        try {
            toast.info('Generating PDF...')
            const shop = await prepareShopBrandingWithLogo(shopInfo)
            const pdfBase64 = await generateWorkOrderPDFBase64(workOrder, workOrderItems ?? [], shop)
            const pdfFilename = getWorkOrderFilename(workOrder)

            const response = await fetch('/api/work-orders/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workOrderId: workOrder.id,
                    customMessage,
                    pdfBase64,
                    pdfFilename,
                }),
            })

            const data = await response.json()
            if (response.ok) {
                toast.success(`${documentLabel} sent successfully!`)
                onConfirm(true)
            } else {
                toast.error(data.error || 'Failed to send email')
                onConfirm(false)
            }
        } catch (error) {
            console.error('Failed to send work order email:', error)
            toast.error('Failed to send email')
            onConfirm(false)
        } finally {
            setIsLoading(false)
        }
    }

    const isReady = emailAvailability.isAvailable && !isLoadingShop && !!shopInfo

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Send {documentLabel} via Email
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        {isWalkIn
                            ? 'Walk-in customers do not have email addresses on file.'
                            : `Send the document with PDF attachment to ${workOrder.customer?.customer_name || 'customer'}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a] space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground dark:text-white">
                                Work Order #{workOrder.work_order_number}
                            </span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">{documentLabel}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                            {vehicleInfo && (
                                <div className="flex items-center gap-1">
                                    <Car className="h-3 w-3" />
                                    {vehicleInfo}
                                </div>
                            )}
                            {total > 0 && (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(total)}
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Paperclip className="h-3 w-3" />
                                PDF will be attached
                            </div>
                        </div>
                    </div>

                    {/* Customer & recipient */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Recipient
                            </h4>
                            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                {isWalkIn ? (
                                    <p className="text-foreground dark:text-white font-medium">Walk-in Customer</p>
                                ) : (
                                    <>
                                        <p className="text-foreground dark:text-white font-medium">{workOrder.customer?.customer_name}</p>
                                        {workOrder.customer?.customer_email && (
                                            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                                {workOrder.customer.customer_email}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                <p className="text-foreground dark:text-white font-medium">{vehicleInfo || 'No vehicle on file'}</p>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border dark:bg-[#2a2a2a]" />

                    {/* Email message */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Message
                            </h3>
                            {(emailAvailability.isLoading || isLoadingShop) && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                            )}
                        </div>

                        {isWalkIn ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Walk-in customers do not have email addresses on file.
                                </p>
                            </div>
                        ) : !customerHasEmail ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    No email address on file for this customer.
                                </p>
                            </div>
                        ) : !emailAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <p className="text-red-600 dark:text-red-400 text-sm">
                                        Email service is not configured. Contact admin to set up Resend.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                <div className="p-3 border-b border-border dark:border-[#2a2a2a] flex items-center justify-between">
                                    <span className="text-sm text-foreground dark:text-gray-300">Message body:</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                    >
                                        {isEditing ? 'Done' : 'Edit'}
                                    </Button>
                                </div>
                                <div className="p-3">
                                    {isEditing ? (
                                        <Textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                            rows={5}
                                        />
                                    ) : (
                                        <p className="text-foreground dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                                            {customMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white"
                    >
                        Cancel
                    </Button>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSend}
                                        disabled={!customerHasEmail || !isReady || isLoading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="h-4 w-4 mr-2" />
                                                Send with PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasEmail || !isReady) && !isLoading && (
                                <TooltipContent className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                    <p>
                                        {!customerHasEmail
                                            ? 'Customer email required'
                                            : isLoadingShop
                                            ? 'Loading shop information...'
                                            : !shopInfo
                                            ? 'Shop information not available'
                                            : 'Email service not configured'}
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
