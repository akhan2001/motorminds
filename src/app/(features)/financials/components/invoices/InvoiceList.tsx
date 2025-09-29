'use client'

import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useInvoices } from '../../hooks/use-invoices'
import { InvoiceCard } from './InvoiceCard'
import type { InvoiceWithDetails } from '../../types/invoice'

interface InvoiceListProps {
    searchValue: string
    onInvoiceClick: (invoiceId: string) => void
    selectedInvoiceId: string | null
}

const InvoiceList: React.FC<InvoiceListProps> = ({
    searchValue,
    onInvoiceClick,
    selectedInvoiceId
}) => {
    const { shopId } = useAuth()
    const { data: invoices, isLoading, error } = useInvoices(shopId || '')

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
            invoice.total_amount?.toString().includes(search)
        )
    }, [invoices, searchValue])

    if (isLoading) {
        return (
            <div className="h-full space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-8 w-48 bg-[#2a2a2a]" />
                    <Skeleton className="h-6 w-24 bg-[#2a2a2a]" />
                </div>
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full bg-[#2a2a2a]" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Error Loading Invoices
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {error instanceof Error ? error.message : 'Failed to load invoices'}
                    </p>
                </div>
            </Card>
        )
    }

    if (filteredInvoices.length === 0) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <FileText className="h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {searchValue ? 'No invoices found' : 'No invoices yet'}
                    </h3>
                    <p className="text-gray-400 text-sm">
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                    All Invoices
                </h2>
                <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300">
                    {filteredInvoices.length} {filteredInvoices.length === 1 ? 'invoice' : 'invoices'}
                </Badge>
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {filteredInvoices.map((invoice) => (
                    <InvoiceCard
                        key={invoice.id}
                        invoice={invoice}
                        isSelected={selectedInvoiceId === invoice.invoice_number}
                        onClick={() => onInvoiceClick(invoice.invoice_number)}
                    />
                ))}
            </div>
        </div>
    )
}

export default InvoiceList
