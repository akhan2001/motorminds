import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FileText, User, Phone, Mail, Lock, Loader2, Car, DollarSign } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils/text'
import { formatCurrency } from '@/lib/utils/currency'
import { useInvoiceSend } from '../../../financials/hooks/use-invoice-send'
import { DEFAULT_INVOICE_MESSAGE, formatInvoiceMessage } from '../../../financials/lib/email/invoice-email-templates'
import type { InvoiceWithDetails } from '../../../financials/types/invoice'

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
    const { sendInvoiceEmail, isLoading, emailAvailability } = useInvoiceSend()

    // Format the default message with actual invoice data
    useEffect(() => {
        if (invoice && isOpen) {
            const customerName = invoice.customer.customer_name || 'Customer'
            const vehicleInfo = invoice.vehicle ? 
                `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
                undefined
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
        if (!invoice.customer.customer_email) {
            onConfirm(false)
            return
        }

        await sendInvoiceEmail({
            to: invoice.customer.customer_email,
            subject: `Invoice ${invoice.invoice_number} - ${invoice.customer.customer_name}`,
            body: customMessage,
            customerName: invoice.customer.customer_name,
            invoiceNumber: invoice.invoice_number
        })

        onConfirm(true, customMessage)
    }

    const vehicleInfo = invoice.vehicle ? 
        `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasEmail = invoice.customer.customer_email

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Send Invoice Email
                    </DialogTitle>
                    <DialogDescription className="text-md text-gray-400">
                        Send the invoice to the customer via email.
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
                                {invoice.customer.customer_email && (
                                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                                        <Mail className="h-3 w-3" />
                                        {invoice.customer.customer_email}
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

                    {/* Email Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Send Invoice Email
                            </h3>
                            {emailAvailability.isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            )}
                        </div>

                        {!customerHasEmail ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-400 text-sm">
                                    No email address available for this customer.
                                </p>
                            </div>
                        ) : !emailAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-400" />
                                    <p className="text-red-400 text-sm">
                                        Email service is not available. Contact admin to set up Resend.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                                    <div className="p-3 border-b border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Email message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-blue-400 hover:text-blue-300"
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
                                                className="bg-[#0a0a0a] border-[#2a2a2a] text-white resize-none"
                                                rows={4}
                                                placeholder="Enter your email message..."
                                            />
                                        ) : (
                                            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                {customMessage}
                                            </p>
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
                                        onClick={handleSendEmail}
                                        disabled={!customerHasEmail || !emailAvailability.isAvailable || isLoading}
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
                                                Send Invoice Email
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasEmail || !emailAvailability.isAvailable) && (
                                <TooltipContent>
                                    <p>
                                        {!customerHasEmail 
                                            ? "Customer email address required" 
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
