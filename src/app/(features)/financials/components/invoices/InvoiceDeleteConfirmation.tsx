'use client'

import React from 'react'
import { AlertTriangle, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ArchiveConfirmationModal } from '@/components/shared/archive-confirmation'
import { formatCurrency } from '@/lib/utils/currency'

export interface InvoiceForDeletion {
    id: string
    invoice_number: string
    display_id?: number
    title?: string
    status: string
    total_amount: number
    customer?: {
        customer_name: string
    }
    vehicle?: {
        year?: number
        make?: string
        model?: string
    }
}

export interface InvoiceDeleteConfirmationProps {
    invoice: InvoiceForDeletion | null
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: () => void
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'paid':
            return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
        case 'sent':
            return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        case 'viewed':
            return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        case 'overdue':
            return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        case 'cancelled':
            return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
        default:
            return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
    }
}

function formatInvoiceNumber(invoice: InvoiceForDeletion): string {
    if (invoice.display_id) return `INV-${invoice.display_id}`
    return invoice.invoice_number
}

export const InvoiceDeleteConfirmation: React.FC<InvoiceDeleteConfirmationProps> = ({
    invoice,
    isOpen,
    isDeleting = false,
    onClose,
    onConfirm,
}) => {
    if (!invoice) return null

    const entityCard = (
        <>
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground">{formatInvoiceNumber(invoice)}</h4>
                <Badge variant="outline" className={getStatusColor(invoice.status)}>
                    {invoice.status}
                </Badge>
            </div>
            {invoice.title && <p className="text-sm text-muted-foreground mb-2">{invoice.title}</p>}
            <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                    <span className="text-foreground">Customer:</span>{' '}
                    {invoice.customer?.customer_name || 'Unknown'}
                </p>
                {invoice.vehicle && (
                    <p>
                        <span className="text-foreground">Vehicle:</span>{' '}
                        {[invoice.vehicle.year, invoice.vehicle.make, invoice.vehicle.model]
                            .filter(Boolean)
                            .join(' ') || 'Unknown'}
                    </p>
                )}
                <p className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-foreground font-medium">
                        {formatCurrency(Number(invoice.total_amount || 0))}
                    </span>
                </p>
            </div>
        </>
    )

    const contentAfterPassword = (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h5 className="text-blue-600 dark:text-blue-400 font-medium mb-1">Archiving Information</h5>
                        <p className="text-blue-600 dark:text-blue-300 text-sm">
                            The invoice will be archived and removed from active financials. You can still access it
                            from archived records.
                        </p>
                    </div>
                </div>
            </div>
            {invoice.status === 'paid' && (
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-4">
                    <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h5 className="text-orange-600 dark:text-orange-400 font-medium mb-1">
                                Warning: Paid Invoice
                            </h5>
                            <p className="text-orange-600 dark:text-orange-300 text-sm">
                                This invoice has been marked as paid. Archiving it will affect your financial
                                records.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <ArchiveConfirmationModal
            title="Archive Invoice"
            entityLabel="Invoice"
            isOpen={isOpen}
            isDeleting={isDeleting}
            onClose={onClose}
            onConfirm={onConfirm}
            confirmButtonLabel="Archive Invoice"
            contentAfterPassword={contentAfterPassword}
        >
            {entityCard}
        </ArchiveConfirmationModal>
    )
}

export default InvoiceDeleteConfirmation
