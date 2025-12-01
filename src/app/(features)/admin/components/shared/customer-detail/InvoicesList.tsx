'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { formatDate, formatCurrency, getInvoiceStatusVariant } from './utils'
import type { Invoice } from './types'

interface InvoicesListProps {
    invoices: Invoice[]
}

export const InvoicesList: React.FC<InvoicesListProps> = ({ invoices }) => {
    if (!invoices || invoices.length === 0) {
        return (
            <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                No invoices found
            </p>
        )
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="space-y-3">
                {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-foreground dark:text-white">
                                        #{invoice.invoice_number}
                                    </h4>
                                    <Badge
                                        variant={getInvoiceStatusVariant(invoice.status)}
                                        className="capitalize"
                                    >
                                        {invoice.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Issued: {formatDate(invoice.issue_date)}
                                    </div>
                                    {invoice.due_date && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Due: {formatDate(invoice.due_date)}
                                        </div>
                                    )}
                                </div>
                                {invoice.work_orders && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                                        Work Order: #{invoice.work_orders.work_order_number}
                                        {invoice.work_orders.title && ` - ${invoice.work_orders.title}`}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-foreground dark:text-white">
                                    {formatCurrency(invoice.total_amount)}
                                </p>
                                {invoice.paid_date && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Paid: {formatDate(invoice.paid_date)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
