'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    Edit, Download, Send, Trash2, FileText, 
    User, Car, Calendar, DollarSign, AlertCircle 
} from 'lucide-react'
import { useInvoice, useDeleteInvoice } from '../../hooks/use-invoices'
import { useAuth } from '../../../operations/hooks/use-auth'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { InvoiceSendModal } from './InvoiceSendModal'
import { formatInvoiceDisplayId } from '../../lib/invoice-calculations'

interface InvoiceDetailsProps {
    invoiceId: string
    onClose: () => void
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoiceId, onClose }) => {
    const { shopId } = useAuth()
    const { data: invoice, isLoading, error } = useInvoice(invoiceId)
    const deleteMutation = useDeleteInvoice()
    const [isSendModalOpen, setIsSendModalOpen] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this invoice?')) return
        
        try {
            await deleteMutation.mutateAsync({ id: invoiceId, shop_id: shopId || '' })
            toast.success('Invoice deleted successfully')
            onClose()
        } catch (error) {
            toast.error('Failed to delete invoice')
        }
    }

    const handleDownload = () => {
        toast.info('PDF download coming soon')
    }

    const handleSend = () => {
        setIsSendModalOpen(true)
    }

    const handleSendConfirm = (sendEmail: boolean, customMessage?: string) => {
        if (sendEmail) {
            toast.success('Invoice email sent successfully!')
        }
        setIsSendModalOpen(false)
    }

    if (isLoading) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6 space-y-4">
                <Skeleton className="h-8 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-32 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-48 w-full bg-[#2a2a2a]" />
            </Card>
        )
    }

    if (error || !invoice) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Error Loading Invoice
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Failed to load invoice details
                    </p>
                </div>
            </Card>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20'
            case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'viewed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            case 'overdue': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
            case 'refunded': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                    onClick={() => {/* TODO: Implement edit */}}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                    onClick={handleDownload}
                >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
                    onClick={handleSend}
                >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </div>

            {/* Invoice Header */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">
                            {formatInvoiceDisplayId(invoice.display_id, invoice.invoice_number)}
                        </h3>
                        <p className="text-gray-400 mt-1">{invoice.title}</p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(invoice.status)}>
                        {invoice.status}
                    </Badge>
                </div>

                {invoice.description && (
                    <p className="text-gray-300 text-sm mb-4">{invoice.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                    </div>
                    {invoice.due_date && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Customer & Vehicle Info */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer
                        </h4>
                        <div className="text-sm space-y-1">
                            <p className="text-white">{invoice.customer?.customer_name}</p>
                            {invoice.customer?.customer_email && (
                                <p className="text-gray-400">{invoice.customer.customer_email}</p>
                            )}
                            {invoice.customer?.customer_phone && (
                                <p className="text-gray-400">{invoice.customer.customer_phone}</p>
                            )}
                        </div>
                    </div>

                    {invoice.vehicle && (
                        <div>
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="text-sm space-y-1">
                                <p className="text-white">
                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                </p>
                                {invoice.vehicle.license_plate && (
                                    <p className="text-gray-400">Plate: {invoice.vehicle.license_plate}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Line Items */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6 flex-1 overflow-y-auto">
                <h4 className="text-white font-semibold mb-4">Line Items</h4>
                <div className="space-y-3">
                    {invoice.invoice_items.map((item, index) => (
                        <div key={index} className="flex items-start justify-between p-3 bg-[#0d0d0d] rounded border border-[#2a2a2a]">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300 text-xs">
                                        {item.item_type}
                                    </Badge>
                                </div>
                                <p className="text-white font-medium">{item.description}</p>
                                <p className="text-gray-400 text-sm">
                                    {item.quantity} × ${item.unit_price.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-semibold">${item.total_price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="mt-6 pt-4 border-t border-[#2a2a2a] space-y-2">
                    <div className="flex justify-between text-gray-400">
                        <span>Subtotal:</span>
                        <span>${Number(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Tax ({(Number(invoice.tax_rate) * 100).toFixed(0)}%):</span>
                        <span>${Number(invoice.tax_amount).toFixed(2)}</span>
                    </div>
                    {invoice.discount_amount > 0 && (
                        <div className="flex justify-between text-gray-400">
                            <span>Discount:</span>
                            <span>-${Number(invoice.discount_amount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-[#2a2a2a]">
                        <span>Total:</span>
                        <span>${Number(invoice.total_amount).toFixed(2)}</span>
                    </div>
                </div>
            </Card>

            {/* Invoice Send Modal */}
            {invoice && (
                <InvoiceSendModal
                    invoice={invoice}
                    isOpen={isSendModalOpen}
                    onClose={() => setIsSendModalOpen(false)}
                    onConfirm={handleSendConfirm}
                />
            )}
        </div>
    )
}

export default InvoiceDetails
