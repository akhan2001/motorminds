'use client'

import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, FileText, Wrench, Eye, Car } from 'lucide-react'
import { formatDate, formatCurrency, getInvoiceStatusVariant } from './utils'
import type { Invoice } from './types'
import { InvoiceQuickView, WorkOrderQuickView } from '@/components/shared/quick-view'

interface InvoicesListProps {
    invoices: Invoice[]
}

const UNPAID_STATUSES = new Set(['unpaid', 'partially_paid', 'draft', 'sent', 'overdue'])

const getOutstanding = (invoice: Invoice) => {
    if (invoice.outstanding_balance != null) return Number(invoice.outstanding_balance) || 0
    return Math.max(0, (Number(invoice.total_amount) || 0) - (Number(invoice.amount_paid) || 0))
}

const isUnpaid = (invoice: Invoice) =>
    UNPAID_STATUSES.has((invoice.status || '').toLowerCase()) && getOutstanding(invoice) > 0.005

export const InvoicesList: React.FC<InvoicesListProps> = ({ invoices }) => {
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null)
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false)

    if (!invoices || invoices.length === 0) {
        return (
            <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                No invoices found
            </p>
        )
    }

    const unpaidInvoices = invoices.filter(isUnpaid)
    const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + getOutstanding(inv), 0)
    const visibleInvoices = showUnpaidOnly ? unpaidInvoices : invoices

    return (
        <>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowUnpaidOnly(false)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            !showUnpaidOnly
                                ? 'bg-foreground text-background border-foreground'
                                : 'text-muted-foreground border-border hover:text-foreground'
                        }`}
                    >
                        All ({invoices.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowUnpaidOnly(true)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                            showUnpaidOnly
                                ? 'bg-red-600 text-white border-red-600'
                                : 'text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10'
                        }`}
                    >
                        Unpaid ({unpaidInvoices.length})
                    </button>
                </div>
                {unpaidInvoices.length > 0 && (
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Outstanding: {formatCurrency(totalOutstanding)}
                    </span>
                )}
            </div>
            <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                    {visibleInvoices.length === 0 && (
                        <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                            No unpaid invoices
                        </p>
                    )}
                    {visibleInvoices.map((invoice) => {
                        const unpaid = isUnpaid(invoice)
                        const isPartial = (invoice.status || '').toLowerCase() === 'partially_paid'
                        return (
                        <div
                            key={invoice.id}
                            className={`p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border transition-colors cursor-pointer ${
                                unpaid
                                    ? 'border-red-300 dark:border-red-500/40 border-l-4 border-l-red-500 hover:border-red-500/60'
                                    : 'border-border dark:border-[#2a2a2a] hover:border-blue-500/30'
                            }`}
                            onClick={() => setSelectedInvoice(invoice.invoice_number)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-foreground dark:text-white flex items-center gap-1">
                                            #{invoice.display_id || invoice.invoice_number}
                                        </span>
                                        {unpaid ? (
                                            <Badge className="bg-red-600 hover:bg-red-600 text-white uppercase">
                                                {isPartial ? 'Partially Paid' : 'Unpaid'}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant={getInvoiceStatusVariant(invoice.status)}
                                                className="capitalize"
                                            >
                                                {invoice.status.replace(/_/g, ' ')}
                                            </Badge>
                                        )}
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
                                    {invoice.work_order && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedWorkOrder(invoice.work_order!.id)
                                                }}
                                                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                                            >
                                                <Wrench className="h-3 w-3" />
                                                WO #{invoice.work_order.work_order_number}
                                                {invoice.work_order.title && ` - ${invoice.work_order.title}`}
                                            </button>
                                        </div>
                                    )}
                                    {(invoice.vehicle || invoice.walk_in_vehicle_info) && (
                                        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400">
                                            <Car className="h-3 w-3 flex-shrink-0" />
                                            {invoice.vehicle ? (
                                                <span>
                                                    {invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}
                                                    {invoice.vehicle.license_plate && ` (${invoice.vehicle.license_plate})`}
                                                </span>
                                            ) : invoice.walk_in_vehicle_info ? (
                                                <span>
                                                    {invoice.walk_in_vehicle_info.year} {invoice.walk_in_vehicle_info.make} {invoice.walk_in_vehicle_info.model}
                                                    {invoice.walk_in_vehicle_info.license_plate && ` (${invoice.walk_in_vehicle_info.license_plate})`}
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <p className="font-semibold text-foreground dark:text-white">
                                        {formatCurrency(invoice.total_amount)}
                                    </p>
                                    {unpaid ? (
                                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                            Owing: {formatCurrency(getOutstanding(invoice))}
                                        </p>
                                    ) : invoice.paid_date && (
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
                                        {invoice.work_order && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedWorkOrder(invoice.work_order!.id)
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
                        )
                    })}
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
