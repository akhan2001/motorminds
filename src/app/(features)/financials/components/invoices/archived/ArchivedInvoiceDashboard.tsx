'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { FileText, Archive } from 'lucide-react'
import ArchivedInvoiceViewOnly from './ArchivedInvoiceViewOnly'

interface ArchivedInvoiceDashboardProps {
    selectedInvoiceId: string | null
    onClose: () => void
}

const ArchivedInvoiceDashboard: React.FC<ArchivedInvoiceDashboardProps> = ({
    selectedInvoiceId,
    onClose,
}) => {
    // Show view-only details when invoice is selected
    if (selectedInvoiceId) {
        return (
            <div className="h-full">
                <ArchivedInvoiceViewOnly 
                    invoiceId={selectedInvoiceId}
                    onClose={onClose}
                />
            </div>
        )
    }

    // Default empty state
    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full flex items-center justify-center">
            <div className="text-center p-8">
                <Archive className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Archived Invoice Selected
                </h3>
                <p className="text-gray-400 text-sm">
                    Select an archived invoice from the list to view details
                </p>
            </div>
        </Card>
    )
}

export default ArchivedInvoiceDashboard

