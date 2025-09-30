'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import InvoiceForm from './InvoiceForm'
import InvoiceViewOnly from './InvoiceViewOnly'

interface InvoiceDashboardProps {
    selectedInvoiceId: string | null
    showForm: boolean
    onClose: () => void
    onEdit?: (invoiceId: string) => void
}

const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({
    selectedInvoiceId,
    showForm,
    onClose,
    onEdit
}) => {
    const [isEditMode, setIsEditMode] = useState(false)

    const handleEdit = () => {
        setIsEditMode(true)
        if (onEdit && selectedInvoiceId) {
            onEdit(selectedInvoiceId)
        }
    }

    const handleCloseEdit = () => {
        setIsEditMode(false)
        onClose()
    }

    // Show form when creating new or editing existing
    if (showForm || isEditMode) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedInvoiceId ? 'Edit Invoice' : 'New Invoice'}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseEdit}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <InvoiceForm 
                    invoiceId={selectedInvoiceId}
                    onClose={handleCloseEdit}
                />
            </div>
        )
    }

    // Show view-only details when invoice is selected
    if (selectedInvoiceId) {
        return (
            <div className="h-full">
                <InvoiceViewOnly 
                    invoiceId={selectedInvoiceId}
                    onEdit={handleEdit}
                    onClose={onClose}
                />
            </div>
        )
    }

    // Default empty state
    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full flex items-center justify-center">
            <div className="text-center p-8">
                <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Invoice Selected
                </h3>
                <p className="text-gray-400 text-sm">
                    Select an invoice from the list or create a new one
                </p>
            </div>
        </Card>
    )
}

export default InvoiceDashboard
