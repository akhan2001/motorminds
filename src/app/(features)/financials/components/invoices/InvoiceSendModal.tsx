import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FileText, User, Phone, Mail, Lock, Loader2, Car, DollarSign, Paperclip } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { formatCurrency } from '@/lib/utils/currency'
import { useInvoiceSend } from '../../hooks/use-invoice-send'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { DEFAULT_INVOICE_MESSAGE, formatInvoiceMessage } from '../../lib/email/invoice-email-templates'
import { prepareShopBrandingWithLogo } from '../../lib/pdf/logo-utils'
import type { InvoiceWithDetails } from '../../types/invoice'
import type { ShopBranding } from '../../types/invoice-pdf'

interface InvoiceSendModalProps {
    invoice: InvoiceWithDetails
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendEmail: boolean, customMessage?: string) => void
}

export const InvoiceSendModal: React.FC<InvoiceSendModalProps> = ({
    invoice,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const { sendInvoiceEmailWithPdf, isLoading, emailAvailability } = useInvoiceSend()
    const { data: shopInfo, isLoading: isLoadingShop } = useShopInfo()

    // Format the default message with actual invoice data
    useEffect(() => {
        if (invoice && isOpen) {
            const isWalkIn = invoice.customer_type === 'walk_in' || !invoice.customer
            const customerName = invoice.customer?.customer_name || (isWalkIn ? 'Walk-in Customer' : 'Customer')
            const vehicleInfo = invoice.vehicle ? 
                `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
                (invoice.walk_in_vehicle_info ? 
                    `${invoice.walk_in_vehicle_info.year} ${invoice.walk_in_vehicle_info.make} ${invoice.walk_in_vehicle_info.model}` : 
                    undefined)
            const invoiceNumber = invoice.invoice_number
            const totalAmount = invoice.total_amount

            const formattedMessage = formatInvoiceMessage(
                DEFAULT_INVOICE_MESSAGE,
                customerName,
                vehicleInfo,
                invoiceNumber,
                totalAmount
            )

            setCustomMessage(formattedMessage)
        }
    }, [invoice, isOpen])

    const handleSendEmail = async () => {
        const isWalkIn = invoice.customer_type === 'walk_in' || !invoice.customer
        if (isWalkIn || !invoice.customer?.customer_email) {
            onConfirm(false)
            return
        }

        if (!shopInfo) {
            onConfirm(false)
            return
        }

        // Convert shop info to ShopBranding format with logo check from storage
        const shop: ShopBranding = await prepareShopBrandingWithLogo(shopInfo)

        // Send email with PDF attachment
        await sendInvoiceEmailWithPdf(
            {
                to: invoice.customer?.customer_email || '',
                subject: `Invoice ${invoice.invoice_number} - ${invoice.customer?.customer_name || 'Customer'}`,
                body: customMessage,
                customerName: invoice.customer?.customer_name || 'Customer',
                invoiceNumber: invoice.invoice_number
            },
            invoice,
            shop,
            'professional' // Use professional template for PDF
        )

        onConfirm(true, customMessage)
    }

    const isWalkIn = invoice.customer_type === 'walk_in' || !invoice.customer
    const vehicleInfo = invoice.vehicle ? 
        `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
        (invoice.walk_in_vehicle_info ? 
            `${invoice.walk_in_vehicle_info.year} ${invoice.walk_in_vehicle_info.make} ${invoice.walk_in_vehicle_info.model}` : 
            'Vehicle information not available')

    const customerHasEmail = !isWalkIn && !!invoice.customer?.customer_email
    const isReady = emailAvailability.isAvailable && !isLoadingShop && shopInfo

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl !bg-white dark:!bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Send Invoice Email
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        {isWalkIn ? 
                            'Walk-in customers do not have email addresses on file. Email sending is not available.' : 
                            'Send the invoice with PDF attachment to the customer via email.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Invoice Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground dark:text-gray-300">Invoice Summary</h3>
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-foreground dark:text-white">Invoice #{invoice.invoice_number}</span>
                                <Badge variant="outline" className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">
                                    {invoice.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(invoice.total_amount || 0)}
                                </div>
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <Paperclip className="h-3 w-3" />
                                    <span>PDF will be attached</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                {isWalkIn ? (
                                    <div>
                                        <p className="text-foreground dark:text-white font-medium">Walk-in Customer</p>
                                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">No customer record on file</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-foreground dark:text-white font-medium">{invoice.customer?.customer_name || 'Unknown'}</p>
                                        {invoice.customer?.customer_phone && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                                <Phone className="h-3 w-3" />
                                                {formatPhoneNumber(invoice.customer.customer_phone)}
                                            </div>
                                        )}
                                        {invoice.customer?.customer_email && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                                <Mail className="h-3 w-3" />
                                                {invoice.customer.customer_email}
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
                                <p className="text-foreground dark:text-white font-medium">{vehicleInfo}</p>
                                {(invoice.vehicle?.license_plate || invoice.walk_in_vehicle_info?.license_plate) && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        License: {invoice.vehicle?.license_plate || invoice.walk_in_vehicle_info?.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border dark:bg-[#2a2a2a]" />

                    {/* Email Section */}
                    <div className="space-y-4">
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
                            <div className="bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Walk-in customers do not have email addresses on file. Please send the invoice manually.
                                </p>
                            </div>
                        ) : !customerHasEmail ? (
                            <div className="bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    No email address available for this customer.
                                </p>
                            </div>
                        ) : !emailAvailability.isAvailable ? (
                            <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <p className="text-red-600 dark:text-red-400 text-sm">
                                        Email service is not available. Contact admin to set up Resend.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                    <div className="p-3 border-b border-border dark:border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-foreground dark:text-gray-300">Email message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                            >
                                                {isEditing ? 'Done' : 'Edit'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        {isEditing ? (
                                            <Textarea
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                                rows={4}
                                                placeholder="Enter your email message..."
                                            />
                                        ) : (
                                            <p className="text-foreground dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                {customMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* PDF Attachment Notice */}
                                <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <p className="text-blue-600 dark:text-blue-400 text-sm">
                                            The invoice PDF will be automatically attached to the email.
                                        </p>
                                    </div>
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
                                        onClick={handleSendEmail}
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
                            {(!customerHasEmail || !isReady) && (
                                <TooltipContent className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                    <p>
                                        {!customerHasEmail 
                                            ? "Customer email address required" 
                                            : isLoadingShop
                                            ? "Loading shop information..."
                                            : !shopInfo
                                            ? "Shop information not available"
                                            : "Contact admin to set up email service"
                                        }
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
