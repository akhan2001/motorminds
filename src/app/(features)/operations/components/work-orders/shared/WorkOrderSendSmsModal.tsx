'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MessageSquare, User, Phone, Car, Lock, Loader2, Link } from 'lucide-react'
import { toast } from 'sonner'
import { formatPhoneNumber } from '@/utils/format-phone'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { useMessagingAvailability } from '../../../hooks/use-work-order-messaging'
import { prepareShopBrandingWithLogo } from '../../../../financials/lib/pdf/logo-utils'
import { generateWorkOrderPDFBase64, getWorkOrderFilename } from '../../../lib/work-order-pdf-generator'
import { getWorkOrderDocumentLabel } from '../pdf/WorkOrderPDFTemplate'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'
import { blobToBase64 } from '@/lib/utils/blob'
import { generateWorkOrderPDF } from '../../../lib/work-order-pdf-generator'

interface WorkOrderSendSmsModalProps {
    workOrder: WorkOrderWithDetails
    workOrderItems?: WorkOrderItem[]
    isOpen: boolean
    onClose: () => void
    onConfirm: (sent: boolean) => void
}

export const WorkOrderSendSmsModal: React.FC<WorkOrderSendSmsModalProps> = ({
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
    const messagingAvailability = useMessagingAvailability()

    const isWalkIn = workOrder.customer_type === 'walk_in' || !workOrder.customer
    const customerHasPhone = !isWalkIn && !!workOrder.customer?.customer_phone
    const documentLabel = getWorkOrderDocumentLabel(workOrder.status)

    const vehicleInfo = workOrder.vehicle
        ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}`
        : workOrder.walk_in_vehicle_info
            ? `${workOrder.walk_in_vehicle_info.year} ${workOrder.walk_in_vehicle_info.make} ${workOrder.walk_in_vehicle_info.model}`
            : undefined

    useEffect(() => {
        if (isOpen && workOrder) {
            const customerName = workOrder.customer?.customer_name || 'Customer'
            const vehicle = vehicleInfo ? ` for your ${vehicleInfo}` : ''
            setCustomMessage(
                `Hi ${customerName}, your ${documentLabel}${vehicle} (WO #${workOrder.work_order_number}) is ready to view. A PDF link will be attached. Thank you!`
            )
        }
    }, [isOpen, workOrder])

    const handleSend = async () => {
        if (!customerHasPhone || !shopInfo || !workOrder.customer?.customer_phone) return

        setIsLoading(true)
        try {
            toast.info('Generating PDF...')
            const shop = await prepareShopBrandingWithLogo(shopInfo)

            // Generate PDF and upload to get shareable URL
            const pdfBlob = await generateWorkOrderPDF(workOrder, workOrderItems ?? [], shop)
            const pdfBase64 = await blobToBase64(pdfBlob)
            const filename = getWorkOrderFilename(workOrder)

            // Upload PDF to get a shareable link (reuse invoice-pdfs bucket)
            const uploadResponse = await fetch('/api/invoices/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64,
                    invoiceNumber: workOrder.work_order_number,
                    filename,
                }),
            })

            const uploadData = await uploadResponse.json()
            const pdfUrl = uploadData.url

            // Compose final SMS body
            const smsBody = pdfUrl
                ? `${customMessage}\nView PDF: ${pdfUrl}`
                : customMessage

            // Send SMS via Twilio
            const smsResponse = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: workOrder.customer.customer_phone,
                    body: smsBody,
                    customerName: workOrder.customer?.customer_name || 'Customer',
                }),
            })

            const smsData = await smsResponse.json()
            if (smsResponse.ok) {
                toast.success(`${documentLabel} sent via SMS!`)
                onConfirm(true)
            } else {
                toast.error(smsData.error || 'Failed to send SMS')
                onConfirm(false)
            }
        } catch (error) {
            console.error('Failed to send work order SMS:', error)
            toast.error('Failed to send SMS')
            onConfirm(false)
        } finally {
            setIsLoading(false)
        }
    }

    const isReady = messagingAvailability.isAvailable && !isLoadingShop && !!shopInfo
    const estimatedLength = customMessage.length + 100 // approximate PDF URL length

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Send {documentLabel} via SMS
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                        {isWalkIn
                            ? 'Walk-in customers do not have phone numbers on file.'
                            : `Send the document with a PDF link to ${workOrder.customer?.customer_name || 'customer'}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground dark:text-white">
                                Work Order #{workOrder.work_order_number}
                            </span>
                            <span className="text-xs text-muted-foreground dark:text-gray-400">{documentLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <Link className="h-3 w-3" />
                            <span>PDF link will be included (valid 72 hours)</span>
                        </div>
                    </div>

                    {/* Customer & Vehicle */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                {isWalkIn ? (
                                    <p className="text-foreground dark:text-white font-medium">Walk-in Customer</p>
                                ) : (
                                    <>
                                        <p className="text-foreground dark:text-white font-medium">{workOrder.customer?.customer_name}</p>
                                        {workOrder.customer?.customer_phone && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                                <Phone className="h-3 w-3" />
                                                {formatPhoneNumber(workOrder.customer.customer_phone)}
                                            </div>
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

                    {/* SMS message section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                SMS Message
                            </h3>
                            {(messagingAvailability.isLoading || isLoadingShop) && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                            )}
                        </div>

                        {isWalkIn ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Walk-in customers do not have phone numbers on file.
                                </p>
                            </div>
                        ) : !customerHasPhone ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    No phone number on file for this customer.
                                </p>
                            </div>
                        ) : !messagingAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <p className="text-red-600 dark:text-red-400 text-sm">
                                        SMS service is not configured. Contact admin to set up Twilio.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                    <div className="p-3 border-b border-border dark:border-[#2a2a2a] flex items-center justify-between">
                                        <span className="text-sm text-foreground dark:text-gray-300">SMS to send:</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                        >
                                            {isEditing ? 'Done' : 'Edit'}
                                        </Button>
                                    </div>
                                    <div className="p-3">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={customMessage}
                                                    onChange={(e) => setCustomMessage(e.target.value)}
                                                    className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                                    rows={3}
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                                                    <span>~{estimatedLength} chars total (inc. PDF link)</span>
                                                    <span>{customMessage.length} chars</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-foreground dark:text-white text-sm leading-relaxed">{customMessage}</p>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400">+ PDF link will be appended</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <p className="text-green-600 dark:text-green-400 text-sm">
                                            A link to view/download the PDF will be automatically added (valid 72 hours).
                                        </p>
                                    </div>
                                </div>
                            </>
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
                                        disabled={!customerHasPhone || !isReady || isLoading}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Send with PDF Link
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasPhone || !isReady) && !isLoading && (
                                <TooltipContent className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                    <p>
                                        {!customerHasPhone
                                            ? 'Customer phone number required'
                                            : isLoadingShop
                                            ? 'Loading shop information...'
                                            : !shopInfo
                                            ? 'Shop information not available'
                                            : 'SMS service not configured'}
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
