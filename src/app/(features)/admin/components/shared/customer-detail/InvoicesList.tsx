'use client'

import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, FileText, Wrench, Eye } from 'lucide-react'
import { formatDate, formatCurrency, getInvoiceStatusVariant } from './utils'
import type { Invoice } from './types'
import { InvoiceQuickView, WorkOrderQuickView } from '@/components/shared/quick-view'

interface InvoicesListProps {
    invoices: Invoice[]
}

export const InvoicesList: React.FC<InvoicesListProps> = ({ invoices }) => {
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null)

    if (!invoices || invoices.length === 0) {
        return (
            <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                No invoices found
            </p>
        )
    }

    return (
        <>
            <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div 
                            key={invoice.id} 
                            className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a] hover:border-blue-500/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedInvoice(invoice.invoice_number)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-foreground dark:text-white flex items-center gap-1">
                                            #{invoice.invoice_number}
                                        </span>
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
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedWorkOrder(invoice.work_orders!.id)
                                                }}
                                                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                                            >
                                                <Wrench className="h-3 w-3" />
                                                WO #{invoice.work_orders.work_order_number}
                                                {invoice.work_orders.title && ` - ${invoice.work_orders.title}`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="font-semibold text-foreground dark:text-white">
                                        {formatCurrency(invoice.total_amount)}
                                    </p>
                                    {invoice.paid_date && (
                                        <p className="text-xs text-green-600 dark:text-green-400">
                                            Paid: {formatDate(invoice.paid_date)}
                                        </p>
                                    )}
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedInvoice(invoice.invoice_number)
                                            }}
                                            className="h-7 px-2 text-xs"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                        {invoice.work_orders && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedWorkOrder(invoice.work_orders!.id)
                                                }}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <Wrench className="h-3 w-3 mr-1" />
                                                WO
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Invoice Quick View Modal */}
            {selectedInvoice && (
                <InvoiceQuickView
                    invoiceId={selectedInvoice}
                    isOpen={!!selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}

            {/* Work Order Quick View Modal */}
            {selectedWorkOrder && (
                <WorkOrderQuickView
                    workOrderId={selectedWorkOrder}
                    isOpen={!!selectedWorkOrder}
                    onClose={() => setSelectedWorkOrder(null)}
                />
            )}
        </>
    )
}
