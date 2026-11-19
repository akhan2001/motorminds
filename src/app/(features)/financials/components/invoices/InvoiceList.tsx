'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useInvoices, type InvoicePaymentFilter } from '../../hooks/use-invoices'
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
    const [paymentFilter, setPaymentFilter] = useState<InvoicePaymentFilter>('all')

    // Debounce the search so we query the server (all invoices, not just the latest 1000)
    const [debouncedSearch, setDebouncedSearch] = useState(searchValue)
    useEffect(() => {
        const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 300)
        return () => clearTimeout(handle)
    }, [searchValue])

    const { data: invoices, isLoading, isFetching, error } = useInvoices(
        shopId || '',
        undefined,
        1000,
        0,
        { search: debouncedSearch, payment: paymentFilter }
    )
    const [quickViewInvoiceId, setQuickViewInvoiceId] = useState<string | null>(null)

    const handleInvoiceClick = (invoiceNumber: string) => {
        if (useQuickView) {
            setQuickViewInvoiceId(invoiceNumber)
        } else {
            onInvoiceClick(invoiceNumber)
        }
    }

    // Search + payment filter are applied server-side; nothing more to filter here
    const filteredInvoices = useMemo(() => invoices || [], [invoices])

    const filterChips = (
        <div className="flex items-center gap-2 mb-3">
            {([
                { key: 'all', label: 'All' },
                { key: 'unpaid', label: 'Unpaid' },
                { key: 'paid', label: 'Paid' },
            ] as const).map(chip => (
                <button
                    key={chip.key}
                    type="button"
                    onClick={() => setPaymentFilter(chip.key)}
                    className={cn(
                        'text-xs px-3 py-1 rounded-full border transition-colors',
                        paymentFilter === chip.key
                            ? chip.key === 'unpaid'
                                ? 'bg-red-600 text-white border-red-600'
                                : chip.key === 'paid'
                                    ? 'bg-green-600 text-white border-green-600'
                                    : 'bg-foreground text-background border-foreground'
                            : 'bg-transparent text-muted-foreground border-border hover:text-foreground'
                    )}
                >
                    {chip.label}
                </button>
            ))}
            {isFetching && !isLoading && (
                <span className="text-xs text-muted-foreground ml-1">Searching…</span>
            )}
        </div>
    )

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
        const isFiltered = !!searchValue || paymentFilter !== 'all'
        return (
            <div className="h-full flex flex-col">
                {filterChips}
                <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] p-8">
                    <div className="flex flex-col items-center justify-center text-center">
                        <FileText className="h-12 w-12 text-muted-foreground dark:text-gray-500 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                            {isFiltered ? 'No invoices found' : 'No invoices yet'}
                        </h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm">
                            {isFiltered
                                ? 'Try adjusting your search terms or filter'
                                : 'Create your first invoice to get started'
                        }
                        </p>
                    </div>
                </Card>
            </div>
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

                {filterChips}

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
