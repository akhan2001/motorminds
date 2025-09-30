'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
    Edit, Download, Send, Trash2, 
    User, Car, LayoutIcon, X, Check, XCircle
} from 'lucide-react'
import { useInvoice, useDeleteInvoice } from '../../hooks/use-invoices'
import { useAuth } from '../../../operations/hooks/use-auth'
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
    const [isLandscape, setIsLandscape] = useState(false)

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

    const toggleFormat = () => {
        setIsLandscape(!isLandscape)
        toast.success(`PDF format set to ${!isLandscape ? 'Landscape' : 'Portrait'}`)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    const formatPhoneNumber = (phone: string | null) => {
        if (!phone) return 'N/A'
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
        }
        return phone
    }

    const formatDateString = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col space-y-4 p-4">
                <Skeleton className="h-10 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-32 w-full bg-[#2a2a2a]" />
                <Skeleton className="h-48 w-full bg-[#2a2a2a]" />
            </div>
        )
    }

    if (error || !invoice) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Error Loading Invoice
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Failed to load invoice details. Please try again.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    // Calculate totals
    const subtotal = invoice.invoice_items.reduce((sum, item) => sum + item.total_price, 0)
    const tax = subtotal * invoice.tax_rate
    const total = subtotal + tax - invoice.discount_amount

    return (
        <div className="h-full flex flex-col bg-[#0d0d0d]">
            {/* Fixed Header */}
            <div className="bg-[#131313] p-4 border-b border-[#333333]">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white">
                            Invoice #{invoice.invoice_number}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {invoice.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-sm">
                            Issued: {formatDateString(invoice.issue_date)}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-[#1A1A1A] p-4">
                <div className="space-y-4">
                    {/* Client Information */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {/* <User className="h-4 w-4" /> */}
                            <h3 className="text-lg font-semibold text-white">Customer Information</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pl-6">
                            <div>
                                <p className="text-xs text-gray-500">Name</p>
                                <p className="text-white font-medium">{invoice.customer?.customer_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-gray-300">{formatPhoneNumber(invoice.customer?.customer_phone || null)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-gray-300">{invoice.customer?.customer_email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="text-gray-300">{invoice.customer?.customer_address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    {/* Vehicle Information */}
                    {invoice.vehicle && (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {/* <Car className="h-4 w-4" /> */}
                                    <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                                </div>
                                <p className="text-white">
                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                    {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL' 
                                        ? ` - ${invoice.vehicle.license_plate}` 
                                        : ''
                                    }
                                </p>
                            </div>
                            <Separator className="bg-gray-700" />
                        </>
                    )}
                    
                    {/* Work Order Details */}
                    <div className="space-y-2">
                        {invoice.title && (
                            <div className="mb-2">
                                <p className="text-lg font-semibold text-white">{invoice.title}</p>
                            </div>
                        )}
                        
                        {invoice.description && (
                            <div className="mb-2">
                                <p className="text-gray-400">{invoice.description}</p>
                            </div>
                        )}

                        {/* Line Items Table */}
                        <div className="space-y-2 mt-4">
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 border-b border-gray-700 pb-2">
                                <div className="col-span-5">DESCRIPTION</div>
                                <div className="col-span-2 text-center">TYPE</div>
                                <div className="col-span-2 text-center">QTY</div>
                                <div className="col-span-3 text-right">TOTAL</div>
                            </div>
                            
                            {/* Invoice Items */}
                            {invoice.invoice_items.map((item, index) => {
                                const isActive = (item as any).active !== false // Use the 'active' field from database
                                return (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-800">
                                        <div className="col-span-5 text-white">
                                            <div className="flex items-center gap-2">
                                                {isActive ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-3 w-3 text-red-500" />
                                                )}
                                                <span>{item.description}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <Badge variant="outline" className="text-xs capitalize text-white">
                                                {item.item_type}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 text-center text-white">{item.quantity}</div>
                                        <div className="col-span-3 text-right text-white">
                                            {item.quantity > 1 ? (
                                                <span>
                                                    {formatCurrency(item.total_price)}
                                                    <span className="text-gray-400 text-xs ml-1">
                                                        ({formatCurrency(item.unit_price)}/ea)
                                                    </span>
                                                </span>
                                            ) : (
                                                formatCurrency(item.total_price)
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {invoice.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-white font-medium">Notes:</p>
                                <p className="text-gray-400 mt-1">{invoice.notes}</p>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-gray-700" />
                    
                    {/* Amount and Status */}
                    <div className="bg-[#222222] p-4 rounded-lg border border-[#333333]">
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (
                                <div className="flex justify-between text-gray-400">
                                    <span>Discount:</span>
                                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <Separator className="bg-gray-700" />
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <p className="text-gray-400 font-medium">Amount Due:</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
                                </div>
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "text-sm px-3 py-1",
                                        invoice.status === 'paid' 
                                            ? 'bg-green-600 text-white border-green-600' 
                                            : 'bg-red-600 text-white border-red-600'
                                    )}
                                >
                                    {invoice.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Footer with Actions */}
            <div className="bg-[#131313] border-t border-[#333333] p-4 flex flex-wrap gap-2">
                <Button 
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700" 
                    onClick={onEdit}
                >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                {/* <Button 
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700" 
                    onClick={toggleFormat}
                >
                    <LayoutIcon className="w-4 h-4 mr-2" />
                    {isLandscape ? "Portrait" : "Landscape"}
                </Button> */}
                <Button 
                    size="sm"
                    className="bg-gray-600 text-white hover:bg-gray-700" 
                    onClick={handleDownload}
                >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                </Button>
                <Button 
                    size="sm"
                    className="bg-purple-600 text-white hover:bg-purple-700" 
                    onClick={handleSend}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                </Button>
                <Button 
                    size="sm"
                    variant="outline"
                    className="ml-auto bg-red-600 text-white hover:bg-red-700 border-red-600" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </div>
    )
}

export default InvoiceViewOnly