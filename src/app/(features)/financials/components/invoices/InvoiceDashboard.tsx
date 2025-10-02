'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import InvoiceFormDialog from './InvoiceFormDialog'
import InvoiceViewOnly from './InvoiceViewOnly'

interface InvoiceDashboardProps {
    selectedInvoiceId: string | null
    onClose: () => void
    onEdit?: (invoiceId: string) => void
}

const InvoiceDashboard: React.FC<InvoiceDashboardProps> = ({
    selectedInvoiceId,
    onClose,
    onEdit
}) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const handleEdit = () => {
        setIsEditDialogOpen(true)
        if (onEdit && selectedInvoiceId) {
            onEdit(selectedInvoiceId)
        }
    }

    const handleCloseEdit = () => {
        setIsEditDialogOpen(false)
    }

    const handleCreate = () => {
        setIsCreateDialogOpen(true)
    }

    const handleCloseCreate = () => {
        setIsCreateDialogOpen(false)
        onClose()
    }

    // Show view-only details when invoice is selected
    if (selectedInvoiceId) {
        return (
            <>
                <div className="h-full">
                    <InvoiceViewOnly 
                        invoiceId={selectedInvoiceId}
                        onEdit={handleEdit}
                        onClose={onClose}
                    />
                </div>
                <InvoiceFormDialog 
                    isOpen={isEditDialogOpen}
                    onClose={handleCloseEdit}
                    invoiceId={selectedInvoiceId}
                />
            </>
        )
    }

    // Default empty state
    return (
        <>
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
            <InvoiceFormDialog 
                isOpen={isCreateDialogOpen}
                onClose={handleCloseCreate}
                invoiceId={null}
            />
        </>
    )
}

export default InvoiceDashboard
