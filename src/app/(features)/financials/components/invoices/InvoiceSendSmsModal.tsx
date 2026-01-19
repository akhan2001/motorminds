import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FileText, User, Phone, MessageSquare, Lock, Loader2, Car, DollarSign, Link } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { formatCurrency } from '@/lib/utils/currency'
import { useInvoiceSms } from '../../hooks/use-invoice-sms'
import { useShopInfo } from '@/hooks/core/useShopInfo'
import type { InvoiceWithDetails } from '../../types/invoice'
import type { ShopBranding } from '../../types/invoice-pdf'

// SMS template for invoices
const DEFAULT_SMS_MESSAGE = "Hi [Customer Name], your invoice #[Invoice Number] for [Vehicle] is ready. Total: [Total Amount]. Thank you!"

function formatSmsMessage(
    template: string, 
    customerName: string, 
    vehicleInfo?: string, 
    invoiceNumber?: string,
    totalAmount?: number
): string {
    return template
        .replace(/\[Customer Name\]/g, customerName)
        .replace(/\[Vehicle\]/g, vehicleInfo || 'your vehicle')
        .replace(/\[Invoice Number\]/g, invoiceNumber || 'N/A')
        .replace(/\[Total Amount\]/g, totalAmount ? `$${totalAmount.toFixed(2)}` : '$0.00')
}

interface InvoiceSendSmsModalProps {
    invoice: InvoiceWithDetails
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendSms: boolean, customMessage?: string) => void
}

export const InvoiceSendSmsModal: React.FC<InvoiceSendSmsModalProps> = ({
    invoice,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const { sendInvoiceSmsWithPdf, isLoading, messagingAvailability } = useInvoiceSms()
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

            const formattedMessage = formatSmsMessage(
                DEFAULT_SMS_MESSAGE,
                customerName,
                vehicleInfo,
                invoiceNumber,
                totalAmount
            )

            setCustomMessage(formattedMessage)
        }
    }, [invoice, isOpen])

    const handleSendSms = async () => {
        const isWalkIn = invoice.customer_type === 'walk_in' || !invoice.customer
        if (isWalkIn || !invoice.customer?.customer_phone) {
            onConfirm(false)
            return
        }

        if (!shopInfo) {
            onConfirm(false)
            return
        }

        // Convert shop info to ShopBranding format
        const shop: ShopBranding = {
            id: shopInfo.id,
            shop_name: shopInfo.shop_name,
            shop_owner: shopInfo.shop_owner,
            shop_email: shopInfo.shop_email,
            shop_phone: shopInfo.shop_phone,
            shop_address: shopInfo.shop_address,
            shop_city: shopInfo.shop_city,
            shop_province: shopInfo.shop_province,
            logo_image_url: shopInfo.logo_image_url,
            business_number: shopInfo.business_number,
            hst_number: shopInfo.hst_number
        }

        // Send SMS with PDF link
        await sendInvoiceSmsWithPdf(
            {
                to: invoice.customer?.customer_phone || '',
                body: customMessage,
                customerName: invoice.customer?.customer_name || 'Customer'
            },
            invoice,
            shop,
            'professional'
        )

        onConfirm(true, customMessage)
    }

    const isWalkIn = invoice.customer_type === 'walk_in' || !invoice.customer
    const vehicleInfo = invoice.vehicle ? 
        `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
        (invoice.walk_in_vehicle_info ? 
            `${invoice.walk_in_vehicle_info.year} ${invoice.walk_in_vehicle_info.make} ${invoice.walk_in_vehicle_info.model}` : 
            'Vehicle information not available')

    const customerHasPhone = !isWalkIn && !!invoice.customer?.customer_phone
    const isReady = messagingAvailability.isAvailable && !isLoadingShop && shopInfo

    // Calculate message length (note: PDF link will add ~100 chars)
    const estimatedTotalLength = customMessage.length + 100 // Approximate link length

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Send Invoice SMS
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        {isWalkIn ? 
                            'Walk-in customers do not have phone numbers on file. SMS sending is not available.' : 
                            'Send the invoice details with PDF link to the customer via SMS.'}
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
                                    <Link className="h-3 w-3" />
                                    <span>PDF link will be included</span>
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

                    {/* SMS Section */}
                    <div className="space-y-4">
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
                            <div className="bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Walk-in customers do not have phone numbers on file. Please send the invoice manually.
                                </p>
                            </div>
                        ) : !customerHasPhone ? (
                            <div className="bg-yellow-500/10 dark:bg-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    No phone number available for this customer.
                                </p>
                            </div>
                        ) : !messagingAvailability.isAvailable ? (
                            <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <p className="text-red-600 dark:text-red-400 text-sm">
                                        SMS service is not available. Contact admin to set up Twilio.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                    <div className="p-3 border-b border-border dark:border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-foreground dark:text-gray-300">SMS message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                            >
                                                {isEditing ? 'Done' : 'Edit'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={customMessage}
                                                    onChange={(e) => setCustomMessage(e.target.value)}
                                                    className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                                    rows={3}
                                                    placeholder="Enter your SMS message..."
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                                                    <span>Message + PDF link (~{estimatedTotalLength} chars)</span>
                                                    <span>{customMessage.length} chars (message only)</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-foreground dark:text-white text-sm leading-relaxed">
                                                    {customMessage}
                                                </p>
                                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                                    {customMessage.length} chars (+ PDF link will be appended)
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PDF Link Notice */}
                                <div className="bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        <p className="text-green-600 dark:text-green-400 text-sm">
                                            A link to view/download the invoice PDF will be automatically added (valid for 72 hours).
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
                                        onClick={handleSendSms}
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
                            {(!customerHasPhone || !isReady) && (
                                <TooltipContent className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                    <p>
                                        {!customerHasPhone 
                                            ? "Customer phone number required" 
                                            : isLoadingShop
                                            ? "Loading shop information..."
                                            : !shopInfo
                                            ? "Shop information not available"
                                            : "Contact admin to set up SMS service"
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
