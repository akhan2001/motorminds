'use client'

import React, { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useInvoices } from '../../hooks/use-invoices'
import { InvoiceCard } from './InvoiceCard'
import { InvoiceQuickView } from '@/components/shared/quick-view'
import type { InvoiceWithDetails } from '../../types/invoice'

interface InvoiceListProps {
    searchValue: string
    onInvoiceClick: (invoiceId: string) => void
    selectedInvoiceId: string | null
    useQuickView?: boolean // If true, opens modal instead of calling onInvoiceClick
}

const InvoiceList: React.FC<InvoiceListProps> = ({
    searchValue,
    onInvoiceClick,
    selectedInvoiceId,
    useQuickView = false
}) => {
    const { shopId, isLoading: isAuthLoading } = useAuth()
    const { data: invoices, isLoading, isFetching, error } = useInvoices(shopId || '')
    const [quickViewInvoiceId, setQuickViewInvoiceId] = useState<string | null>(null)

    const handleInvoiceClick = (invoiceNumber: string) => {
        if (useQuickView) {
            setQuickViewInvoiceId(invoiceNumber)
        } else {
            onInvoiceClick(invoiceNumber)
        }
    }

    // Filter invoices based on search
    const filteredInvoices = useMemo(() => {
        if (!invoices) return []
        if (!searchValue) return invoices

        const search = searchValue.toLowerCase()
        return invoices.filter(invoice => 
            invoice.invoice_number?.toLowerCase().includes(search) ||
            invoice.display_id?.toLowerCase().includes(search) ||
            invoice.customer?.customer_name?.toLowerCase().includes(search) ||
            invoice.title?.toLowerCase().includes(search) ||
            invoice.total_amount?.toString().includes(search) ||
            // Search walk-in customer info
            (invoice.customer_type === 'walk_in' && 'walk-in'.includes(search)) ||
            (invoice.walk_in_vehicle_info?.make?.toLowerCase().includes(search)) ||
            (invoice.walk_in_vehicle_info?.model?.toLowerCase().includes(search)) ||
            (invoice.walk_in_vehicle_info?.license_plate?.toLowerCase().includes(search))
        )
    }, [invoices, searchValue])

    // Show loading if:
    // - Auth is loading
    // - No shopId yet
    // - Invoices are loading (initial load only, not background refetches)
    // - ShopId exists but invoices haven't been loaded yet (undefined means query hasn't completed)
    // Note: isFetching is excluded to prevent loading state during background refetches (e.g., when tabbing back in)
    const isDataLoading = isAuthLoading || !shopId || isLoading || (shopId && invoices === undefined)

    if (isDataLoading) {
        return (
            <div className="h-full space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-8 w-48 bg-secondary dark:bg-[#2a2a2a]" />
                    <Skeleton className="h-6 w-24 bg-secondary dark:bg-[#2a2a2a]" />
                </div>
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                        Error Loading Invoices
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400 text-sm">
                        {error instanceof Error ? error.message : 'Failed to load invoices'}
                    </p>
                </div>
            </Card>
        )
    }

    // Only show "no invoices" if we have successfully loaded data (even if empty) - not while loading or before shopId is available
    // invoices will be an array (even if empty) when the query has completed successfully
    if (!isDataLoading && shopId && invoices !== undefined && Array.isArray(invoices) && filteredInvoices.length === 0) {
        return (
            <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <FileText className="h-12 w-12 text-muted-foreground dark:text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                        {searchValue ? 'No invoices found' : 'No invoices yet'}
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400 text-sm">
                        {searchValue 
                            ? 'Try adjusting your search terms'
                            : 'Create your first invoice to get started'
                    }
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <>
            <div className="h-full flex flex-col">
                {/* Header */}
                {/* <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        All Invoices
                    </h2>
                    <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300">
                        {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                    </Badge>
                </div> */}

                {/* Invoice List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {filteredInvoices.map((invoice) => (
                        <InvoiceCard
                            key={invoice.id}
                            invoice={invoice}
                            isSelected={selectedInvoiceId === invoice.invoice_number}
                            onClick={() => handleInvoiceClick(invoice.invoice_number)}
                        />
                    ))}
                </div>
            </div>

            {/* Quick View Modal */}
            {quickViewInvoiceId && (
                <InvoiceQuickView
                    invoiceId={quickViewInvoiceId}
                    isOpen={!!quickViewInvoiceId}
                    onClose={() => setQuickViewInvoiceId(null)}
                />
            )}
        </>
    )
}

export default InvoiceList
