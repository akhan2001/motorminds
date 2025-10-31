import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FileText, User, Phone, MessageSquare, Lock, Loader2, Car, DollarSign } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils/text'
import { formatCurrency } from '@/lib/utils/currency'
import { useInvoiceSms } from '../../hooks/use-invoice-sms'
import type { InvoiceWithDetails } from '../../types/invoice'

// SMS template for invoices
const DEFAULT_SMS_MESSAGE = "Hi [Customer Name], your invoice #[Invoice Number] for [Vehicle] is ready. Total: [Total Amount]. Please contact us if you have any questions. Thank you!"

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
    const { sendInvoiceSms, isLoading, messagingAvailability } = useInvoiceSms()

    // Format the default message with actual invoice data
    useEffect(() => {
        if (invoice && isOpen) {
            const customerName = invoice.customer.customer_name || 'Customer'
            const vehicleInfo = invoice.vehicle ? 
                `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
                undefined
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
        if (!invoice.customer.customer_phone) {
            onConfirm(false)
            return
        }

        await sendInvoiceSms({
            to: invoice.customer.customer_phone,
            body: customMessage,
            customerName: invoice.customer.customer_name
        })

        onConfirm(true, customMessage)
    }

    const vehicleInfo = invoice.vehicle ? 
        `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasPhone = !!invoice.customer.customer_phone

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        Send Invoice SMS
                    </DialogTitle>
                    <DialogDescription className="text-md text-gray-400">
                        Send the invoice details to the customer via SMS.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Invoice Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Invoice Summary</h3>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-white">Invoice #{invoice.invoice_number}</span>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    {invoice.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(invoice.total_amount || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                <p className="text-white font-medium">{invoice.customer.customer_name || 'Unknown'}</p>
                                {invoice.customer.customer_phone && (
                                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(invoice.customer.customer_phone)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                <p className="text-white font-medium">{vehicleInfo}</p>
                                {invoice.vehicle?.license_plate && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        License: {invoice.vehicle.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* SMS Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Send Invoice SMS
                            </h3>
                            {messagingAvailability.isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            )}
                        </div>

                        {!customerHasPhone ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-400 text-sm">
                                    No phone number available for this customer.
                                </p>
                            </div>
                        ) : !messagingAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-400" />
                                    <p className="text-red-400 text-sm">
                                        SMS service is not available. Contact admin to set up Twilio.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                                    <div className="p-3 border-b border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">SMS message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-green-400 hover:text-green-300"
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
                                                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white resize-none"
                                                    rows={3}
                                                    placeholder="Enter your SMS message..."
                                                    maxLength={160}
                                                />
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>SMS messages are limited to 160 characters</span>
                                                    <span>{customMessage.length}/160</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-white text-sm leading-relaxed">
                                                    {customMessage}
                                                </p>
                                                <div className="text-xs text-gray-400">
                                                    {customMessage.length}/160 characters
                                                </div>
                                            </div>
                                        )}
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
                        className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                    >
                        Cancel
                    </Button>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSendSms}
                                        disabled={!customerHasPhone || !messagingAvailability.isAvailable || isLoading}
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
                                                Send Invoice SMS
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasPhone || !messagingAvailability.isAvailable) && (
                                <TooltipContent>
                                    <p>
                                        {!customerHasPhone 
                                            ? "Customer phone number required" 
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
