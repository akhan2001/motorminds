'use client'

import React, { useState } from 'react'
import { FileText, Calendar, DollarSign, Building2, Archive, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomerInvoices } from '../../../hooks/use-customer-invoices'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { InvoiceDetailSheet } from '@/app/(features)/financials/components/invoices/InvoiceDetailSheet'
import type { InvoiceWithDetails } from '@/app/(features)/financials/types/invoice'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/currency'

interface InvoiceHistoryPanelProps {
    customerId: string | null | undefined
    shopId: string | undefined
}

export const InvoiceHistoryPanel: React.FC<InvoiceHistoryPanelProps> = ({
    customerId,
    shopId
}) => {
    const { data: invoices, isLoading, error } = useCustomerInvoices(customerId, shopId, true) // Enable organization-wide invoice access
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const handleInvoiceClick = (invoice: InvoiceWithDetails) => {
        setSelectedInvoice(invoice)
        setIsSheetOpen(true)
    }

    const handleCloseSheet = () => {
        setIsSheetOpen(false)
        setSelectedInvoice(null)
    }

    const getStatusBadge = (status: string | null | undefined) => {
        if (!status) {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20 text-xs">N/A</Badge>
        }
        const statusLower = status.toLowerCase()
        if (statusLower === 'paid') {
            return <Badge className="bg-green-500/10 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 dark:border-green-500/20 text-xs">Paid</Badge>
        } else if (statusLower === 'unpaid' || statusLower === 'sent') {
            return <Badge className="bg-yellow-500/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-500/20 text-xs">Unpaid</Badge>
        } else if (statusLower === 'draft') {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20 text-xs">Draft</Badge>
        } else if (statusLower === 'overdue') {
            return <Badge className="bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/20 text-xs">Overdue</Badge>
        } else if (statusLower === 'viewed') {
            return <Badge className="bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/20 text-xs">Viewed</Badge>
        } else if (statusLower === 'cancelled') {
            return <Badge className="bg-gray-500/10 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 dark:border-gray-500/20 text-xs">Cancelled</Badge>
        } else if (statusLower === 'refunded') {
            return <Badge className="bg-orange-500/10 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 dark:border-orange-500/20 text-xs">Refunded</Badge>
        }
        return <Badge className="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20 text-xs">{status}</Badge>
    }

    if (!customerId) {
        return (
            <div className="p-4">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                            No customer associated with this Work Order.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <div className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">Error Loading Invoice History</h3>
                        <p className="text-red-500 dark:text-red-400 text-sm">
                            {error instanceof Error ? error.message : 'Failed to load invoice history'}
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="p-4">
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                    <div className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">No Invoice History</h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                            No previous invoices for this customer.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <h4 className="text-sm font-semibold text-foreground dark:text-white">Invoice History</h4>
                </div>
                <span className="text-xs text-muted-foreground dark:text-gray-400 bg-secondary dark:bg-[#2a2a2a] px-2 py-1 rounded">
                    {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                </span>
            </div>

            {/* Invoice List */}
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {invoices.map((invoice) => (
                    <Card
                        key={invoice.id}
                        className={cn(
                            "bg-white dark:bg-[#131313] border-border dark:border-[#2a2a2a] p-4 transition-all hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:shadow-lg cursor-pointer"
                        )}
                        onClick={() => handleInvoiceClick(invoice)}
                    >
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-1">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-medium text-foreground dark:text-white truncate">
                                        {invoice.title || 'Untitled Invoice'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                        #{invoice.display_id || invoice.invoice_number}
                                    </p>
                                </div>
                                {/* Show shop indicator for invoices from other shops */}
                                {!(invoice as any).isFromCurrentShop && (invoice as any).shopName && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex-shrink-0">
                                        <Building2 className="h-3 w-3 mr-1" />
                                        {(invoice as any).shopName}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full border",
                                    invoice.status === 'paid' 
                                        ? 'text-green-600 dark:text-green-500 border-green-800 dark:border-green-800' 
                                        : 'text-red-600 dark:text-red-500 border-red-800 dark:border-red-800'
                                )}>
                                    {invoice.status?.toUpperCase() || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-border dark:border-gray-800 my-2"></div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Customer Info */}
                            <div>
                                <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">CUSTOMER</p>
                                <p className="text-xs font-medium text-foreground dark:text-white truncate">
                                    {invoice.customer?.customer_name || 'Unknown'}
                                </p>
                                {invoice.customer?.customer_email && (
                                    <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                                        {invoice.customer.customer_email}
                                    </p>
                                )}
                            </div>

                            {/* Vehicle Info */}
                            {invoice.vehicle ? (
                                <div>
                                    <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">VEHICLE</p>
                                    <p className="text-xs font-medium text-foreground dark:text-white">
                                        {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                    </p>
                                    {invoice.vehicle.license_plate && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                            Plate: {invoice.vehicle.license_plate}
                                        </p>
                                    )}
                                </div>
                            ) : invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info ? (
                                <div>
                                    <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">VEHICLE</p>
                                    <p className="text-xs font-medium text-foreground dark:text-white">
                                        {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                    </p>
                                    {invoice.walk_in_vehicle_info.license_plate && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                            Plate: {invoice.walk_in_vehicle_info.license_plate}
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            {/* Amount */}
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase mb-0.5">
                                    {invoice.status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE"}
                                </p>
                                <p className={cn(
                                    "text-base font-bold",
                                    invoice.status === "paid" 
                                        ? "text-green-600 dark:text-green-500" 
                                        : "text-red-600 dark:text-red-500"
                                )}>
                                    {formatCurrency((!invoice.tax_rate || invoice.tax_rate === 0) ? invoice.subtotal : invoice.total_amount)}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
                                    Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Footer Row */}
                        {(invoice.work_order || invoice.payment_method || invoice.paid_date) && (
                            <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-border dark:border-gray-800">
                                <div className="flex items-center gap-1">
                                    {invoice.work_order && (
                                        <Badge variant="secondary" className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 text-xs px-1 py-0.5">
                                            Work Order: {invoice.work_order.work_order_number || invoice.work_order.title}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {invoice.paid_date && (
                                        <span className="text-xs text-muted-foreground dark:text-gray-500">
                                            Paid: {format(new Date(invoice.paid_date), 'MMM dd, yyyy')}
                                        </span>
                                    )}
                                    {invoice.payment_method && (
                                        <span className="text-xs text-muted-foreground dark:text-gray-500 capitalize">
                                            {invoice.payment_method.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Invoice Detail Sheet */}
            <InvoiceDetailSheet
                invoice={selectedInvoice}
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
            />
        </div>
    )
}
