'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Calendar, DollarSign, User, Car, Wrench, Package, CreditCard, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import type { InvoiceWithDetails } from '../../types/invoice'

interface InvoiceDetailSheetProps {
    invoice: InvoiceWithDetails | null
    isOpen: boolean
    onClose: () => void
}

export const InvoiceDetailSheet: React.FC<InvoiceDetailSheetProps> = ({
    invoice,
    isOpen,
    onClose
}) => {
    if (!invoice) return null

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">N/A</Badge>
        }
        const statusLower = status.toLowerCase()
        if (statusLower === 'paid') {
            return <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20">Paid</Badge>
        } else if (statusLower === 'unpaid' || statusLower === 'sent') {
            return <Badge className="bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/20">Unpaid</Badge>
        } else if (statusLower === 'draft') {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Draft</Badge>
        } else if (statusLower === 'overdue') {
            return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20">Overdue</Badge>
        }
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">{status}</Badge>
    }

    const getPriorityBadge = (priority: string | null | undefined) => {
        if (!priority) {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Medium</Badge>
        }
        const priorityLower = priority.toLowerCase()
        if (priorityLower === 'urgent') {
            return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20">Urgent</Badge>
        } else if (priorityLower === 'high') {
            return <Badge className="bg-orange-500/10 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/20">High</Badge>
        } else if (priorityLower === 'low') {
            return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20">Low</Badge>
        }
        return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20">Medium</Badge>
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return format(new Date(dateString), 'MMM d, yyyy')
    }

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    }

    // Parse invoice items
    const invoiceItems = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : []

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[600px] sm:w-[700px] bg-white dark:bg-[#0a0a0a] border-border dark:border-[#222222] overflow-y-auto">
                <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            <SheetTitle className="text-foreground dark:text-white text-lg">
                                {invoice.display_id || invoice.invoice_number}
                            </SheetTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusBadge(invoice.status)}
                            {getPriorityBadge(invoice.priority)}
                        </div>
                    </div>
                    {invoice.title && (
                        <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">{invoice.title}</p>
                    )}
                </SheetHeader>

                <div className="space-y-6">
                    {/* Customer Information */}
                    {invoice.customer && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Customer</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="text-foreground dark:text-white">{invoice.customer.customer_name}</div>
                                {invoice.customer.customer_email && (
                                    <div className="text-muted-foreground dark:text-gray-400">{invoice.customer.customer_email}</div>
                                )}
                                {invoice.customer.customer_phone && (
                                    <div className="text-muted-foreground dark:text-gray-400">{invoice.customer.customer_phone}</div>
                                )}
                                {invoice.customer.customer_address && (
                                    <div className="text-muted-foreground dark:text-gray-400 flex items-start gap-1">
                                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        {invoice.customer.customer_address}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Vehicle Information */}
                    {invoice.vehicle && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Vehicle</h3>
                            </div>
                            <div className="text-sm">
                                <div className="text-foreground dark:text-white">
                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                </div>
                                {invoice.vehicle.license_plate && (
                                    <div className="text-muted-foreground dark:text-gray-400 mt-1">
                                        License: {invoice.vehicle.license_plate}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Work Order Information */}
                    {invoice.work_order && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Work Order</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="text-foreground dark:text-white">
                                    {invoice.work_order.work_order_number || invoice.work_order.title}
                                </div>
                                <div className="text-muted-foreground dark:text-gray-400">Status: {invoice.work_order.status}</div>
                            </div>
                        </div>
                    )}

                    {/* Financial Summary */}
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <h3 className="text-foreground dark:text-white font-medium">Financial Summary</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Subtotal:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.labor_total > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Labor:</span>
                                    <span className="text-foreground dark:text-white">{formatCurrency(invoice.labor_total)}</span>
                                </div>
                            )}
                            {invoice.parts_total > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Parts:</span>
                                    <span className="text-foreground dark:text-white">{formatCurrency(invoice.parts_total)}</span>
                                </div>
                            )}
                            {invoice.services_total > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Services:</span>
                                    <span className="text-foreground dark:text-white">{formatCurrency(invoice.services_total)}</span>
                                </div>
                            )}
                            {invoice.fees_total > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Fees:</span>
                                    <span className="text-foreground dark:text-white">{formatCurrency(invoice.fees_total)}</span>
                                </div>
                            )}
                            {invoice.discount_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Discount:</span>
                                    <span className="text-green-600 dark:text-green-400">-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Tax ({(invoice.tax_rate * 100).toFixed(1)}%):</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(invoice.tax_amount)}</span>
                            </div>
                            <Separator className="bg-border dark:bg-[#2a2a2a]" />
                            <div className="flex justify-between text-lg font-semibold">
                                <span className="text-foreground dark:text-white">Total:</span>
                                <span className="text-foreground dark:text-white">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    {invoiceItems.length > 0 && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Invoice Items</h3>
                            </div>
                            <div className="space-y-3">
                                {invoiceItems.map((item: any, index: number) => (
                                    <div key={item.id || index} className="bg-background dark:bg-[#0f0f0f] rounded p-3 border border-border dark:border-[#2a2a2a]">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="text-foreground dark:text-white text-sm font-medium">{item.description}</div>
                                                <div className="text-muted-foreground dark:text-gray-400 text-xs mt-1">
                                                    Type: {item.item_type} • Qty: {item.quantity}
                                                    {item.part_number && ` • Part #: ${item.part_number}`}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                item.item_type === 'discount' 
                                                    ? 'text-red-600 dark:text-red-400' 
                                                    : 'text-foreground dark:text-white'
                                            }`}>
                                                {item.item_type === 'discount' ? (
                                                    <>-{formatCurrency(Math.abs(item.total_price || 0))}</>
                                                ) : (
                                                    formatCurrency(item.total_price || 0)
                                                )}
                                            </div>
                                        </div>
                                        {item.unit_price && (
                                            <div className="text-muted-foreground dark:text-gray-400 text-xs">
                                                Unit Price: {formatCurrency(item.unit_price)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Information */}
                    {(invoice.payment_method || invoice.paid_date) && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <h3 className="text-foreground dark:text-white font-medium">Payment Information</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                {invoice.payment_method && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Method:</span>
                                        <span className="text-foreground dark:text-white capitalize">{invoice.payment_method.replace('_', ' ')}</span>
                                    </div>
                                )}
                                {invoice.paid_date && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Paid Date:</span>
                                        <span className="text-foreground dark:text-white">{formatDate(invoice.paid_date)}</span>
                                    </div>
                                )}
                                {invoice.payment_reference && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground dark:text-gray-400">Reference:</span>
                                        <span className="text-foreground dark:text-white">{invoice.payment_reference}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            <h3 className="text-foreground dark:text-white font-medium">Important Dates</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Issue Date:</span>
                                <span className="text-foreground dark:text-white">{formatDate(invoice.issue_date)}</span>
                            </div>
                            {invoice.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground dark:text-gray-400">Due Date:</span>
                                    <span className="text-foreground dark:text-white">{formatDate(invoice.due_date)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Created:</span>
                                <span className="text-foreground dark:text-white">{formatDateTime(invoice.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground dark:text-gray-400">Updated:</span>
                                <span className="text-foreground dark:text-white">{formatDateTime(invoice.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <h3 className="text-foreground dark:text-white font-medium mb-2">Notes</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Description */}
                    {invoice.description && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <h3 className="text-foreground dark:text-white font-medium mb-2">Description</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm whitespace-pre-wrap">{invoice.description}</p>
                        </div>
                    )}

                    {/* Migration Metadata (if exists) */}
                    {(invoice as any).migration_metadata && (
                        <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <h3 className="text-foreground dark:text-white font-medium mb-2">Migration Data</h3>
                            <div className="text-xs text-muted-foreground dark:text-gray-400 font-mono bg-background dark:bg-[#0f0f0f] p-2 rounded border border-border dark:border-[#2a2a2a] overflow-x-auto">
                                <pre>{JSON.stringify((invoice as any).migration_metadata, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
