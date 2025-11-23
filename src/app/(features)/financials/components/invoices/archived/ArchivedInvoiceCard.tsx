'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Archive } from 'lucide-react'
import type { InvoiceWithDetails } from '../../../types/invoice'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ArchivedInvoiceCardProps {
    invoice: InvoiceWithDetails
    isSelected?: boolean
    onClick?: () => void
}

export const ArchivedInvoiceCard: React.FC<ArchivedInvoiceCardProps> = ({ invoice, isSelected = false, onClick }) => {
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
        <Card
            className={cn(
                "bg-white dark:bg-[#131313] border-border dark:border-[#2a2a2a] p-4 transition-all hover:bg-slate-100 dark:hover:bg-[#1a1a1a] hover:shadow-lg",
                isSelected && "border-zinc-500 dark:border-zinc-500 ring-1 ring-red-500/20",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5 text-muted-foreground dark:text-gray-500" />
                    <div>
                        <h3 className="text-sm font-medium text-foreground dark:text-white">
                            {invoice.title || 'Untitled Invoice'}
                        </h3>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">#{invoice.display_id || invoice.invoice_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`${invoice.status === 'paid' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} text-xs px-1.5 py-0.5 rounded-full border ${invoice.status === 'paid' ? 'border-green-800 dark:border-green-800' : 'border-red-800 dark:border-red-800'}`}>
                        {invoice.status.toUpperCase()}
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
                    <p className="text-xs font-medium text-foreground dark:text-white">{invoice.customer?.customer_name || 'Unknown'}</p>
                    {invoice.customer?.customer_email && (
                        <p className="text-xs text-muted-foreground dark:text-gray-400">{invoice.customer.customer_email}</p>
                    )}
                </div>

                {/* Vehicle Info */}
                {invoice.vehicle && (
                    <div>
                        <p className="text-xs uppercase mb-0.5 text-muted-foreground dark:text-gray-400">VEHICLE</p>
                        <p className="text-xs font-medium text-foreground dark:text-white">
                            {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                        </p>
                        {invoice.vehicle.license_plate && (
                            <p className="text-xs text-muted-foreground dark:text-gray-400">Plate: {invoice.vehicle.license_plate}</p>
                        )}
                    </div>
                )}

                {/* Amount */}
                <div className="text-right">
                    <p className="text-xs text-muted-foreground dark:text-gray-400 uppercase mb-0.5">
                        {invoice.status === "paid" ? "AMOUNT PAID" : "AMOUNT DUE"}
                    </p>
                    <p className={`text-base font-bold ${invoice.status === "paid" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        ${Number((!invoice.tax_rate || invoice.tax_rate === 0) ? invoice.subtotal : invoice.total_amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</p>
                </div>
            </div>

            {/* Footer Row */}
            {(invoice.work_order || invoice.payment_method) && (
                <div className="flex items-center justify-between pt-1.5 border-t border-border dark:border-gray-800">
                    <div className="flex items-center gap-1">
                        {invoice.work_order && (
                            <Badge variant="secondary" className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 text-xs px-1 py-0.5">
                                WO: {invoice.work_order.work_order_number}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="bg-gray-700/50 dark:bg-gray-700/50 text-muted-foreground dark:text-gray-400 text-xs px-1 py-0.5">
                            Archived
                        </Badge>
                    </div>

                    {invoice.payment_method && (
                        <span className="text-xs text-muted-foreground dark:text-gray-500 capitalize">
                            {invoice.payment_method.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}
        </Card>
    )
}

export default ArchivedInvoiceCard

