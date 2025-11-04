'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { 
    Download, Archive, 
    User, Car, LayoutIcon, X, Check, XCircle
} from 'lucide-react'
import { useArchivedInvoice } from '../../../hooks/use-archived-invoices'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ArchivedInvoiceViewOnlyProps {
    invoiceId: string
    onClose: () => void
}

const ArchivedInvoiceViewOnly: React.FC<ArchivedInvoiceViewOnlyProps> = ({ invoiceId, onClose }) => {
    const { data: invoice, isLoading, error } = useArchivedInvoice(invoiceId)

    const handleDownload = () => {
        toast.info('PDF download coming soon')
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
                <Skeleton className="h-10 w-full bg-secondary dark:bg-[#2a2a2a]" />
                <Skeleton className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                <Skeleton className="h-48 w-full bg-secondary dark:bg-[#2a2a2a]" />
            </div>
        )
    }

    if (error || !invoice) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                            Error Loading Invoice
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            Failed to load archived invoice details. Please try again.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    // Calculate totals
    const subtotal = invoice.invoice_items
        .filter(item => (item as any).active !== false)
        .reduce((sum, item) => sum + item.total_price, 0)
    const tax = subtotal * invoice.tax_rate
    const total = subtotal + tax - invoice.discount_amount

    return (
        <div className="h-full flex flex-col bg-background dark:bg-[#0d0d0d]">
            {/* Fixed Header */}
            <div className="bg-slate-50 dark:bg-[#131313] p-4 border-b border-border dark:border-[#333333]">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Archive className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                            <h2 className="text-xl font-semibold text-foreground dark:text-white">
                                Archived Invoice #{invoice.invoice_number}
                            </h2>
                        </div>
                        <p className="text-muted-foreground dark:text-gray-500 text-sm">
                            {invoice.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            Issued: {formatDateString(invoice.issue_date)}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-transparent"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-background dark:bg-[#1A1A1A] p-2">
                <div className="space-y-2">
                    {/* Customer Information Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer Information</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Name</p>
                                    <p className="text-foreground dark:text-white font-medium">{invoice.customer?.customer_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Phone</p>
                                    <p className="text-foreground dark:text-gray-300">{formatPhoneNumber(invoice.customer?.customer_phone || null)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Email</p>
                                    <p className="text-foreground dark:text-gray-300">{invoice.customer?.customer_email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Address</p>
                                    <p className="text-foreground dark:text-gray-300">{invoice.customer?.customer_address || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                    
                    {/* Vehicle Information Card */}
                    {invoice.vehicle && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Vehicle Information</h3>
                                </div>
                                <p className="text-foreground dark:text-white">
                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                    {invoice.vehicle.license_plate && invoice.vehicle.license_plate !== 'NULL' 
                                        ? ` - ${invoice.vehicle.license_plate}` 
                                        : ''
                                    }
                                </p>
                            </div>
                        </Card>
                    )}
                    
                    {/* Work Order Details Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <LayoutIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-lg font-semibold text-foreground dark:text-white">Invoice Details</h2>
                            </div>
                            
                            {invoice.title && (
                                <div className="mb-1">
                                    <h3 className="text-md font-semibold text-foreground dark:text-white">{invoice.title}</h3>
                                </div>
                            )}
                            
                            {invoice.description && (
                                <div className="mb-4">
                                    <p className="text-muted-foreground dark:text-gray-400">{invoice.description}</p>
                                </div>
                            )}

                            {/* Line Items Table */}
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground dark:text-gray-400 border-b border-border dark:border-gray-700 pb-2">
                                    <div className="col-span-5">DESCRIPTION</div>
                                    <div className="col-span-2 text-center">TYPE</div>
                                    <div className="col-span-2 text-center">QTY / HOURS</div>
                                    <div className="col-span-3 text-right">TOTAL</div>
                                </div>
                                
                                {/* Invoice Items */}
                                {invoice.invoice_items.map((item, index) => {
                                    const isActive = (item as any).active !== false
                                    return (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-border dark:border-gray-800">
                                            <div className="col-span-5 text-foreground dark:text-white">
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
                                                <Badge variant="outline" className="text-xs capitalize text-foreground dark:text-white">
                                                    {item.item_type}
                                                </Badge>
                                            </div>
                                            <div className="col-span-2 text-center text-foreground dark:text-white">
                                                {item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}
                                            </div>
                                            <div className="col-span-3 text-right text-foreground dark:text-white">
                                                {item.item_type === 'labor' ? (
                                                    <span>
                                                        {formatCurrency(item.total_price)}
                                                        <span className="text-muted-foreground dark:text-gray-400 text-xs ml-1">
                                                            ({formatCurrency(item.unit_price)}/hr)
                                                        </span>
                                                    </span>
                                                ) : item.quantity > 1 ? (
                                                    <span>
                                                        {formatCurrency(item.total_price)}
                                                        <span className="text-muted-foreground dark:text-gray-400 text-xs ml-1">
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
                                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700">
                                    <p className="text-foreground dark:text-white font-medium">Notes:</p>
                                    <p className="text-muted-foreground dark:text-gray-400 mt-1">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                    
                    {/* Amount and Status Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Invoice Summary</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-foreground dark:text-white">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground dark:text-gray-400">
                                    <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <Separator className="bg-border dark:bg-gray-700" />
                                <div className="flex justify-between items-center pt-2">
                                    <div>
                                        <p className="text-muted-foreground dark:text-gray-400 font-medium">Amount Due:</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground dark:text-white">{formatCurrency(total)}</p>
                                    </div>
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
                    </Card>
                </div>
            </div>

            {/* Fixed Footer with Actions */}
            <div className="bg-slate-50 dark:bg-[#131313] border-t border-border dark:border-[#333333] p-4 flex flex-wrap gap-2">
                <Button 
                    size="sm"
                    className="bg-gray-600 text-white hover:bg-gray-700" 
                    onClick={handleDownload}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                <Badge variant="secondary" className="ml-auto bg-gray-700/50 dark:bg-gray-700/50 text-muted-foreground dark:text-gray-400">
                    <Archive className="h-3 w-3 mr-1" />
                    Archived
                </Badge>
            </div>
        </div>
    )
}

export default ArchivedInvoiceViewOnly

