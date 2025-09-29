'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    Edit, Download, Send, Trash2, 
    User, Car, Calendar, DollarSign, AlertCircle, FileText, Package 
} from 'lucide-react'
import { useInvoice, useDeleteInvoice } from '../../hooks/use-invoices'
import { useAuth } from '../../../operations/hooks/use-auth'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InvoiceViewOnlyProps {
    invoiceId: string
    onEdit: () => void
    onClose: () => void
}

const InvoiceViewOnly: React.FC<InvoiceViewOnlyProps> = ({ invoiceId, onEdit, onClose }) => {
    const { shopId } = useAuth()
    const { data: invoice, isLoading, error } = useInvoice(invoiceId)
    const deleteMutation = useDeleteInvoice()

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return
        
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
        toast.info('Email send coming soon')
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col space-y-4">
                <Skeleton className="h-10 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-32 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-48 w-full bg-[#2a2a2a]" />
            </div>
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
                        Failed to load invoice details. Please try again.
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20'
            case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
            case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }
    }

    const getItemTypeColor = (type: string) => {
        switch (type) {
            case 'labor': return 'bg-blue-500/10 text-blue-400'
            case 'part': return 'bg-purple-500/10 text-purple-400'
            case 'service': return 'bg-green-500/10 text-green-400'
            case 'fee': return 'bg-orange-500/10 text-orange-400'
            default: return 'bg-gray-500/10 text-gray-400'
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-4">
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    onClick={onEdit}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    onClick={handleDownload}
                >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                    onClick={handleSend}
                >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* Invoice Header Card */}
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                    <h2 className="text-3xl font-bold text-white">
                                        {invoice.display_id || invoice.invoice_number}
                                    </h2>
                                </div>
                                <p className="text-gray-300 text-lg">{invoice.title || 'Untitled Invoice'}</p>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <Badge variant="outline" className={cn("text-sm px-3 py-1", getStatusColor(invoice.status))}>
                                    {invoice.status.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className={cn("text-xs px-2 py-0.5", getPriorityColor(invoice.priority))}>
                                    {invoice.priority}
                                </Badge>
                            </div>
                        </div>

                        {invoice.description && (
                            <p className="text-gray-400 text-sm mb-4 p-3 bg-[#0d0d0d] rounded border border-[#2a2a2a]">
                                {invoice.description}
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2a2a2a]">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-gray-500 text-xs">Issue Date</p>
                                    <p className="text-white">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>
                            {invoice.due_date && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Due Date</p>
                                        <p className="text-white">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            )}
                            {invoice.paid_date && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-green-400" />
                                    <div>
                                        <p className="text-gray-500 text-xs">Paid Date</p>
                                        <p className="text-green-400">{format(new Date(invoice.paid_date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {invoice.work_order && (
                            <div className="mt-4 p-3 bg-[#0d0d0d] rounded border border-[#2a2a2a]">
                                <p className="text-gray-500 text-xs mb-1">Work Order</p>
                                <p className="text-white font-medium">{invoice.work_order.work_order_number}</p>
                                <p className="text-gray-400 text-sm">{invoice.work_order.title}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Customer & Vehicle Info Card */}
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Customer Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="h-5 w-5 text-red-500" />
                                    <h3 className="text-white font-semibold text-lg">Customer</h3>
                                </div>
                                <div className="space-y-2 pl-7">
                                    <div>
                                        <p className="text-gray-500 text-xs">Name</p>
                                        <p className="text-white font-medium">{invoice.customer?.customer_name || 'N/A'}</p>
                                    </div>
                                    {invoice.customer?.customer_email && (
                                        <div>
                                            <p className="text-gray-500 text-xs">Email</p>
                                            <p className="text-gray-300">{invoice.customer.customer_email}</p>
                                        </div>
                                    )}
                                    {invoice.customer?.customer_phone && (
                                        <div>
                                            <p className="text-gray-500 text-xs">Phone</p>
                                            <p className="text-gray-300">{invoice.customer.customer_phone}</p>
                                        </div>
                                    )}
                                    {invoice.customer?.customer_address && (
                                        <div>
                                            <p className="text-gray-500 text-xs">Address</p>
                                            <p className="text-gray-300">{invoice.customer.customer_address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            {invoice.vehicle && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Car className="h-5 w-5 text-red-500" />
                                        <h3 className="text-white font-semibold text-lg">Vehicle</h3>
                                    </div>
                                    <div className="space-y-2 pl-7">
                                        <div>
                                            <p className="text-gray-500 text-xs">Vehicle</p>
                                            <p className="text-white font-medium">
                                                {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                            </p>
                                        </div>
                                        {invoice.vehicle.license_plate && (
                                            <div>
                                                <p className="text-gray-500 text-xs">License Plate</p>
                                                <p className="text-gray-300">{invoice.vehicle.license_plate}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Line Items Card */}
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="h-5 w-5 text-red-500" />
                            <h3 className="text-white font-semibold text-lg">Line Items</h3>
                            <Badge variant="secondary" className="ml-2 bg-[#2a2a2a] text-gray-300">
                                {invoice.invoice_items.length} items
                            </Badge>
                        </div>
                        
                        <div className="space-y-3">
                            {invoice.invoice_items.map((item, index) => {
                                const isDeclined = (item as any).is_declined
                                return (
                                    <div 
                                        key={index} 
                                        className={cn(
                                            "p-4 rounded-lg border transition-colors",
                                            isDeclined 
                                                ? "bg-red-900/20 border-red-500/30 opacity-75" 
                                                : "bg-[#0d0d0d] border-[#2a2a2a] hover:border-[#3a3a3a]"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={cn(
                                                        "text-xs px-2 py-0.5",
                                                        isDeclined 
                                                            ? "bg-red-500/20 text-red-400 border-red-500/30" 
                                                            : getItemTypeColor(item.item_type)
                                                    )}>
                                                        {isDeclined ? "DECLINED" : item.item_type.toUpperCase()}
                                                    </Badge>
                                                    {item.part_number && (
                                                        <span className="text-xs text-gray-500">#{item.part_number}</span>
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "font-medium",
                                                    isDeclined ? "text-red-300 line-through" : "text-white"
                                                )}>
                                                    {item.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>×</span>
                                                    <span className={isDeclined ? "text-red-400" : ""}>
                                                        ${Number(item.unit_price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className={cn(
                                                    "font-bold text-lg",
                                                    isDeclined ? "text-red-400" : "text-white"
                                                )}>
                                                    ${Number(item.total_price).toFixed(2)}
                                                </p>
                                                {isDeclined && (
                                                    <p className="text-xs text-red-400 mt-1">Not charged</p>
                                                )}
                                            </div>
                                        </div>
                                    
                                        {/* Additional item details */}
                                        <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-[#1a1a1a]">
                                            {item.supplier && (
                                                <span className="text-xs text-gray-500">Supplier: {item.supplier}</span>
                                            )}
                                            {item.category && (
                                                <span className="text-xs text-gray-500">Category: {item.category}</span>
                                            )}
                                            {item.labor_hours && (
                                                <span className="text-xs text-gray-500">Hours: {item.labor_hours}</span>
                                            )}
                                            {item.warranty_period && (
                                                <span className="text-xs text-gray-500">Warranty: {item.warranty_period}</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Totals Section */}
                        <div className="mt-6 pt-6 border-t-2 border-[#2a2a2a]">
                            <div className="space-y-3">
                                {/* Category Totals */}
                                {invoice.labor_total > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Labor Total:</span>
                                        <span className="text-gray-300 font-medium">${Number(invoice.labor_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {invoice.parts_total > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Parts Total:</span>
                                        <span className="text-gray-300 font-medium">${Number(invoice.parts_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {invoice.services_total > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Services Total:</span>
                                        <span className="text-gray-300 font-medium">${Number(invoice.services_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {invoice.fees_total > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Fees Total:</span>
                                        <span className="text-gray-300 font-medium">${Number(invoice.fees_total).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-[#2a2a2a]"></div>

                                {/* Subtotal, Tax, Discount */}
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-300">Subtotal:</span>
                                    <span className="text-white font-medium">${Number(invoice.subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-300">Tax ({(Number(invoice.tax_rate) * 100).toFixed(1)}%):</span>
                                    <span className="text-white font-medium">${Number(invoice.tax_amount).toFixed(2)}</span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-base text-green-400">
                                        <span>Discount:</span>
                                        <span className="font-medium">-${Number(invoice.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-3 border-t-2 border-[#2a2a2a]"></div>

                                {/* Grand Total */}
                                <div className="flex justify-between text-2xl">
                                    <span className="text-white font-bold">Total:</span>
                                    <span className="text-red-500 font-bold">${Number(invoice.total_amount).toFixed(2)}</span>
                                </div>

                                {/* Payment Info */}
                                {invoice.payment_method && (
                                    <div className="mt-4 p-3 bg-[#0d0d0d] rounded border border-[#2a2a2a]">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Payment Method:</span>
                                            <span className="text-white font-medium capitalize">
                                                {invoice.payment_method.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {invoice.payment_reference && (
                                            <div className="flex items-center justify-between text-sm mt-1">
                                                <span className="text-gray-400">Reference:</span>
                                                <span className="text-gray-300">{invoice.payment_reference}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Notes Card */}
                {invoice.notes && (
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <div className="p-6">
                            <h3 className="text-white font-semibold text-lg mb-3">Notes</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default InvoiceViewOnly
