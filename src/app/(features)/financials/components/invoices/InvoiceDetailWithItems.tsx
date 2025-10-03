'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Upload } from 'lucide-react'
import { InvoiceItemsList, InvoiceItemsSummary } from '../invoice-items'
import { useImportWorkOrderItems } from '../../hooks/use-invoice-items'
import { getWorkOrderItemsForInvoice } from '../../lib/work-order-to-invoice-helper'
import { toast } from 'sonner'

interface InvoiceDetailWithItemsProps {
    invoiceId: string
    shopId: string
    workOrderId?: string | null
    invoiceStatus?: string
    onBack?: () => void
}

/**
 * Invoice Detail Page with Items Management
 * 
 * This component shows:
 * - Invoice items list (left)
 * - Invoice summary (right)
 * - Import from work order (if linked)
 * 
 * Usage:
 * <InvoiceDetailWithItems 
 *   invoiceId={invoiceId}
 *   shopId={shopId}
 *   workOrderId={invoice.work_order_id}
 *   invoiceStatus={invoice.status}
 * />
 */
export const InvoiceDetailWithItems: React.FC<InvoiceDetailWithItemsProps> = ({
    invoiceId,
    shopId,
    workOrderId,
    invoiceStatus = 'draft',
    onBack,
}) => {
    const router = useRouter()
    const [isImporting, setIsImporting] = useState(false)
    const [showImportDialog, setShowImportDialog] = useState(false)

    const importMutation = useImportWorkOrderItems()

    const isEditable = invoiceStatus !== 'paid' && invoiceStatus !== 'cancelled'

    const handleImportFromWorkOrder = async () => {
        if (!workOrderId) {
            toast.error('No work order linked to this invoice')
            return
        }

        setIsImporting(true)
        try {
            // Fetch work order items
            const items = await getWorkOrderItemsForInvoice(workOrderId)

            if (items.length === 0) {
                toast.warning('No items found in the work order')
                setIsImporting(false)
                return
            }

            // Import items
            await importMutation.mutateAsync({
                invoiceId,
                shopId,
                workOrderItems: items,
            })

            setShowImportDialog(false)
        } catch (error: any) {
            console.error('Failed to import work order items:', error)
            toast.error(error.message || 'Failed to import items')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onBack}
                                className="text-gray-400 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-white">Invoice Details</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                Manage invoice items and view summary
                            </p>
                        </div>
                    </div>

                    {/* Import from Work Order */}
                    {workOrderId && isEditable && (
                        <Button
                            onClick={() => setShowImportDialog(true)}
                            variant="outline"
                            className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import from Work Order
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Items List (2/3 width) */}
                <div className="lg:col-span-2">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                        <InvoiceItemsList
                            invoiceId={invoiceId}
                            shopId={shopId}
                            isEditable={isEditable}
                        />
                    </Card>
                </div>

                {/* Right: Summary (1/3 width) */}
                <div>
                    <InvoiceItemsSummary
                        invoiceId={invoiceId}
                        showBreakdown={true}
                    />

                    {/* Additional Info Card */}
                    {!isEditable && (
                        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4 mt-4">
                            <p className="text-sm text-gray-400">
                                This invoice is <span className="text-white font-medium">{invoiceStatus}</span> and cannot be edited.
                            </p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Import Confirmation Dialog */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Import Work Order Items</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-gray-300">
                            This will import all items from the linked work order into this invoice.
                        </p>
                        <p className="text-sm text-gray-400">
                            Imported items can be edited or removed later if needed.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportDialog(false)}
                            disabled={isImporting}
                            className="border-[#2a2a2a] text-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImportFromWorkOrder}
                            disabled={isImporting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isImporting ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Items
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default InvoiceDetailWithItems

