'use client'

import React, { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, FileText } from 'lucide-react'
import { WorkOrderKanbanItem } from '../../../types/work-order'
import { createClient } from '@/utils/supabase/client'
import { ArchiveConfirmationModal } from '@/components/shared/archive-confirmation'

export interface WorkOrderDeleteConfirmationProps {
    workOrder: WorkOrderKanbanItem | null
    isOpen: boolean
    isDeleting?: boolean
    onClose: () => void
    onConfirm: (options: { deleteInvoice: boolean }) => void
}

export const WorkOrderDeleteConfirmation: React.FC<WorkOrderDeleteConfirmationProps> = ({
    workOrder,
    isOpen,
    isDeleting = false,
    onClose,
    onConfirm,
}) => {
    const [deleteInvoice, setDeleteInvoice] = useState(false)
    const [hasInvoice, setHasInvoice] = useState(false)
    const [invoiceInfo, setInvoiceInfo] = useState<{
        invoice_number: string
        status: string
        total_amount: number
    } | null>(null)
    const [isCheckingInvoice, setIsCheckingInvoice] = useState(false)

    useEffect(() => {
        const checkInvoice = async () => {
            if (!workOrder?.id || !isOpen) return
            setIsCheckingInvoice(true)
            try {
                const supabase = createClient()
                const { data: invoice, error } = await supabase
                    .from('invoices_table')
                    .select('invoice_number, status, total_amount')
                    .eq('work_order_id', workOrder.id)
                    .single()
                if (!error && invoice) {
                    setHasInvoice(true)
                    setInvoiceInfo(invoice)
                } else {
                    setHasInvoice(false)
                    setInvoiceInfo(null)
                }
            } catch (err) {
                console.error('Error checking invoice:', err)
                setHasInvoice(false)
                setInvoiceInfo(null)
            } finally {
                setIsCheckingInvoice(false)
            }
        }
        checkInvoice()
    }, [workOrder?.id, isOpen])

    useEffect(() => {
        if (isOpen) setDeleteInvoice(false)
    }, [isOpen])

    if (!workOrder) return null

    const entityCard = (
        <>
            <h4 className="font-medium text-foreground mb-2">{workOrder.title}</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                    <span className="text-foreground">Customer:</span> {workOrder.customer || 'Unknown'}
                </p>
                <p>
                    <span className="text-foreground">Vehicle:</span> {workOrder.vehicle || 'Unknown'}
                </p>
                <p>
                    <span className="text-foreground">Status:</span>
                    <span
                        className={`ml-1 capitalize ${
                            workOrder.status === 'completed'
                                ? 'text-green-600 dark:text-green-400'
                                : workOrder.status === 'in_progress'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : workOrder.status === 'pending'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-muted-foreground'
                        }`}
                    >
                        {workOrder.status}
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
                            The work order will be archived and moved to historical records. You can still access it
                            from the customer&apos;s service history.
                        </p>
                    </div>
                </div>
            </div>
            {hasInvoice && invoiceInfo && (
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-4">
                    <div className="flex gap-3">
                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h5 className="text-orange-600 dark:text-orange-400 font-medium mb-2">
                                Associated Invoice Found
                            </h5>
                            <div className="text-sm text-orange-700 dark:text-orange-300 mb-3 space-y-1">
                                <p>
                                    <span className="font-medium">Invoice #:</span> {invoiceInfo.invoice_number}
                                </p>
                                <p>
                                    <span className="font-medium">Status:</span>{' '}
                                    <span className="capitalize">{invoiceInfo.status}</span>
                                </p>
                                <p>
                                    <span className="font-medium">Amount:</span> $
                                    {Number(invoiceInfo.total_amount || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-start gap-3 pt-2 border-t border-orange-300 dark:border-orange-500/30">
                                <Checkbox
                                    id="delete-invoice"
                                    checked={deleteInvoice}
                                    onCheckedChange={(checked) => setDeleteInvoice(checked === true)}
                                    className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                />
                                <div>
                                    <Label
                                        htmlFor="delete-invoice"
                                        className="text-orange-700 dark:text-orange-300 font-medium cursor-pointer"
                                    >
                                        Also cancel this invoice
                                    </Label>
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        The invoice will be marked as cancelled and removed from financials.
                                        {invoiceInfo.status === 'paid' && (
                                            <span className="font-medium"> Warning: This invoice has been paid.</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <ArchiveConfirmationModal
            title="Archive Work Order"
            entityLabel="Work Order"
            isOpen={isOpen}
            isDeleting={isDeleting}
            onClose={onClose}
            onConfirm={() => onConfirm({ deleteInvoice })}
            confirmButtonLabel={`Archive Work Order${deleteInvoice ? ' & Invoice' : ''}`}
            contentAfterPassword={contentAfterPassword}
        >
            {entityCard}
        </ArchiveConfirmationModal>
    )
}
