'use client'

import { useState } from 'react'
import type { InvoiceWithDetails } from '../types/invoice'

export function useInvoiceDetailSheet() {
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const openInvoiceDetail = (invoice: InvoiceWithDetails) => {
        setSelectedInvoice(invoice)
        setIsSheetOpen(true)
    }

    const closeInvoiceDetail = () => {
        setIsSheetOpen(false)
        setSelectedInvoice(null)
    }

    return {
        selectedInvoice,
        isSheetOpen,
        openInvoiceDetail,
        closeInvoiceDetail
    }
}
