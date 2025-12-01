'use client'

import React, { useState } from 'react'
import { FileText, Calendar, DollarSign, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCustomerInvoices } from '../../../hooks/use-customer-invoices'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { InvoiceDetailSheet } from '@/app/(features)/financials/components/invoices/InvoiceDetailSheet'
import type { InvoiceWithDetails } from '@/app/(features)/financials/types/invoice'

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


    if (!customerId) {
        return (
            <div className="p-4">
                <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                        No customer associated with this work order.
                    </p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground dark:text-gray-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-sm text-red-500 dark:text-red-400">
                        Failed to load invoice history.
                    </p>
                </div>
            </div>
        )
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="p-4">
                <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                        No previous invoices for this customer.
                    </p>
                </div>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase()
        if (statusLower === 'paid') {
            return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">Paid</Badge>
        } else if (statusLower === 'unpaid' || statusLower === 'sent') {
            return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 text-xs">Unpaid</Badge>
        } else if (statusLower === 'draft') {
            return <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 text-xs">Draft</Badge>
        }
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">{status}</Badge>
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    return (
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground dark:text-white">Invoice History</h4>
                <span className="text-xs text-muted-foreground dark:text-gray-400">{invoices.length} invoices</span>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.invoice_number}
                            className="bg-white dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#333333] transition-colors cursor-pointer"
                            onClick={() => handleInvoiceClick(invoice)}
                        >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <span className="text-sm font-medium text-foreground dark:text-white">
                                    {invoice.display_id || invoice.invoice_number}
                                </span>
                                {/* Show shop indicator for invoices from other shops */}
                                {!(invoice as any).isFromCurrentShop && (invoice as any).shopName && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                        <Building2 className="h-3 w-3 mr-1" />
                                        {(invoice as any).shopName}
                                    </Badge>
                                )}
                            </div>
                            {getStatusBadge(invoice.status)}
                        </div>

                        {invoice.work_order && (
                            <div className="text-xs text-muted-foreground dark:text-gray-400 mb-1">
                                WO: {invoice.work_order.work_order_number || invoice.work_order.title}
                            </div>
                        )}

                        {invoice.vehicle && (
                            <div className="text-xs text-muted-foreground dark:text-gray-400 mb-2">
                                {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                {invoice.vehicle.license_plate && ` (${invoice.vehicle.license_plate})`}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-foreground dark:text-white">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(invoice.total_amount || 0)}
                            </div>
                        </div>

                        {invoice.paid_date && (
                            <div className="mt-2 pt-2 border-t border-border dark:border-[#2a2a2a] text-xs text-muted-foreground dark:text-gray-400">
                                Paid: {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                            </div>
                        )}
                    </div>
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
