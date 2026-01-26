'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../hooks/use-auth'
import { useWorkOrdersWithDetails } from '../hooks/use-work-orders'
import { useWorkOrderStats } from '../hooks/use-work-order-stats'
import { useWorkOrderPageState } from '../hooks/use-work-order-page-state'
import { useWorkOrderOperations } from '../hooks/use-work-order-operations'
import { useCreateInvoiceFromWorkOrder, useSyncInvoiceFromWorkOrder, getWorkOrderInvoiceStatus } from '../../financials/hooks/use-invoices'
import { transformWorkOrdersToKanbanColumns } from '../lib/work-order-transformers'
import { WorkOrdersPageView } from './WorkOrdersPageView'
import { InvoiceSyncWarningDialog } from '../components/work-orders/invoice-sync-warning-dialog'
import { WorkOrderCompleteInvoiceModal } from '../components/work-orders/complete/work-order-complete-invoice-modal'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'
import { PageLoading, PageError } from '@/components/common/feedback/page-states'

/**
 * WorkOrdersPageContent - Container Component
 * Handles authentication, data fetching, and state management
 * Passes data to the presentational component
 */
// Roles that can delete work orders and invoices
const ADMIN_ROLES = ['admin', 'super', 'shop_admin']

export function WorkOrdersPageContent() {
    // Authentication
    const { user, shopId, userRole, isLoading: authLoading } = useAuth()
    const router = useRouter()
    
    // Check if current user can delete (admin only)
    const canDelete = userRole ? ADMIN_ROLES.includes(userRole) : false

    // Data fetching - only fetch if we have a valid shopId
    const { data: workOrders, isLoading: workOrdersLoading, error: workOrdersError, refetch } = useWorkOrdersWithDetails(shopId || '')

    // Transform work orders to kanban format
    const kanbanData = useMemo(() => {
        if (!workOrders) return []
        return transformWorkOrdersToKanbanColumns(workOrders)
    }, [workOrders])

    // Calculate stats using custom hook
    const stats = useWorkOrderStats(kanbanData)

    // Page state management
    const pageState = useWorkOrderPageState(workOrders)

    // Work order operations
    const operations = useWorkOrderOperations(shopId, user, workOrders, refetch)

    // Invoice generation and sync
    const createInvoiceMutation = useCreateInvoiceFromWorkOrder()
    const syncInvoiceMutation = useSyncInvoiceFromWorkOrder()

    // Invoice sync warning dialog state
    const [invoiceSyncWarningOpen, setInvoiceSyncWarningOpen] = useState(false)
    const [pendingCompletionData, setPendingCompletionData] = useState<{
        sendMessage: boolean
        customMessage?: string
        enableAutomatedMessages: boolean
        workOrder: typeof pageState.completionWorkOrder
        invoiceInfo?: {
            invoice_number: string
            amount_paid: number
            total_amount: number
        }
    } | null>(null)
    // Track generated invoice number to show "Go to Invoice" button
    const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState<string | null>(null)
    // State for drag-to-complete invoice modal
    const [isCompleteInvoiceModalOpen, setIsCompleteInvoiceModalOpen] = useState(false)
    const [dragToCompleteWorkOrder, setDragToCompleteWorkOrder] = useState<typeof pageState.completionWorkOrder | null>(null)

    const handleGenerateInvoice = async (workOrderId: string) => {
        if (!shopId) {
            toast.error('Shop ID is required')
            return
        }

        try {
            // Find the work order object
            const workOrder = workOrders?.find(wo => wo.id === workOrderId)
            if (!workOrder) {
                toast.error('Work order not found')
                return
            }

            const invoice = await createInvoiceMutation.mutateAsync({
                work_order_id: workOrderId,
                shop_id: shopId
            })

            if (invoice) {
                toast.success('Invoice generated successfully')
                refetch() // Refresh work orders to show invoice status
                
                // Mark work order as complete
                await operations.handleCompletionConfirm(
                    workOrder,
                    false, // sendMessage
                    undefined, // customMessage
                    false // enableAutomatedMessages
                )
                toast.success('Work order completed successfully')
                
                // Navigate to invoice page using query parameter
                if (invoice.invoice_number) {
                    router.push(`/financials/invoices?invoice_number=${invoice.invoice_number}`)
                } else {
                    router.push('/financials/invoices')
                }
            }
        } catch (error: any) {
            console.error('Error generating invoice:', error)
            toast.error(error?.message || 'Failed to generate invoice')
        }
    }

    const handleGoToInvoice = async (workOrderId: string) => {
        // Fetch invoice for this work order to get invoice_number
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data: invoice } = await supabase
            .from('invoices_table')
            .select('invoice_number')
            .eq('work_order_id', workOrderId)
            .limit(1)
            .single()

        if (invoice?.invoice_number) {
            router.push(`/financials/invoices?invoice_number=${invoice.invoice_number}`)
        } else {
            router.push('/financials/invoices')
        }
    }

    // Handle completion with invoice sync
    const handleCompletionConfirmWithSync = async (
        sendMessage: boolean,
        customMessage?: string,
        enableAutomatedMessages: boolean = true,
        generateInvoice: boolean = true
    ) => {
        if (!pageState.completionWorkOrder || !shopId) return

        try {
            // Check if this work order has an existing invoice
            const invoiceStatus = await getWorkOrderInvoiceStatus(pageState.completionWorkOrder.id)

            if (invoiceStatus.hasInvoice && invoiceStatus.invoice) {
                // Invoice exists - check if it has payments
                if (invoiceStatus.invoice.amount_paid > 0) {
                    // Show warning dialog for invoice with payments
                    // Store work order in pending data since pageState might reset
                    setPendingCompletionData({
                        sendMessage,
                        customMessage,
                        enableAutomatedMessages,
                        workOrder: pageState.completionWorkOrder,
                        invoiceInfo: invoiceStatus.invoice
                    })
                    setInvoiceSyncWarningOpen(true)
                    return
                }

                // No payments - sync automatically
                await syncInvoiceMutation.mutateAsync({
                    work_order_id: pageState.completionWorkOrder.id,
                    shop_id: shopId
                })
                toast.success('Invoice synced with updated work order items')
            } else if (generateInvoice) {
                // No invoice exists and user wants to generate one
                try {
                    const invoice = await createInvoiceMutation.mutateAsync({
                        work_order_id: pageState.completionWorkOrder.id,
                        shop_id: shopId
                    })
                    toast.success('Invoice generated successfully')
                    // Set the generated invoice number to show "Go to Invoice" button
                    // Don't close modal yet - let user see the button
                    setGeneratedInvoiceNumber(invoice.invoice_number)
                    // Refetch to update work order with invoice_id
                    refetch()
                    // Don't proceed with completion yet - keep modal open
                    return
                } catch (invoiceError: any) {
                    console.error('Error generating invoice:', invoiceError)
                    toast.error(invoiceError?.message || 'Failed to generate invoice')
                    // Continue with completion even if invoice generation fails
                }
            }

            // Proceed with completion (only if no invoice was generated or invoice generation failed)
            await operations.handleCompletionConfirm(
                pageState.completionWorkOrder,
                sendMessage,
                customMessage,
                enableAutomatedMessages
            )
            // Clear generated invoice number and close modal after completion
            setGeneratedInvoiceNumber(null)
            // Only close modal if not generating invoice (invoice generation keeps modal open)
            if (!generateInvoice) {
                pageState.handleCompletionModalClose()
            }
        } catch (error: any) {
            console.error('Error during completion with sync:', error)
            toast.error(error?.message || 'Failed to complete work order')
        }
    }

    // Handle confirmed sync after warning dialog
    const handleConfirmSyncWithPayments = async () => {
        // Capture data immediately - use workOrder from pendingCompletionData since pageState may have reset
        const completionData = pendingCompletionData
        const workOrder = pendingCompletionData?.workOrder
        const currentShopId = shopId

        // Close dialog immediately
        setInvoiceSyncWarningOpen(false)
        setPendingCompletionData(null)

        if (!completionData || !workOrder || !currentShopId) {
            console.error('Missing data for completion:', { completionData, workOrder, currentShopId })
            toast.error('Failed to complete work order - missing data')
            return
        }

        try {
            // Sync the invoice
            await syncInvoiceMutation.mutateAsync({
                work_order_id: workOrder.id,
                shop_id: currentShopId
            })
            toast.success('Invoice synced with updated work order items')

            // Proceed with completion
            await operations.handleCompletionConfirm(
                workOrder,
                completionData.sendMessage,
                completionData.customMessage,
                completionData.enableAutomatedMessages
            )
        } catch (error: any) {
            console.error('Error syncing invoice:', error)
            toast.error(error?.message || 'Failed to sync invoice')
        }
    }

    const handleCancelSyncWarning = () => {
        setInvoiceSyncWarningOpen(false)
        setPendingCompletionData(null)
        // Also close the completion modal since user cancelled
        pageState.handleCompletionModalClose()
    }

    // Handle ready confirmation
    const handleReadyConfirm = async (sendMessage: boolean, customMessage?: string) => {
        if (!pageState.readyWorkOrder) return

        try {
            await operations.handleReadyConfirm(
                pageState.readyWorkOrder,
                sendMessage,
                customMessage
            )
        } catch (error: any) {
            console.error('Error marking work order as ready:', error)
            toast.error(error?.message || 'Failed to mark work order as ready')
        }
    }

    // Handle drag-to-complete: open invoice modal instead of completion modal
    const handleDragToCompleteAttempt = (item: any) => {
        // Find the full work order details from the workOrders array
        const fullWorkOrder = workOrders?.find(wo => wo.id === item.id)
        if (fullWorkOrder) {
            setDragToCompleteWorkOrder(fullWorkOrder)
            setIsCompleteInvoiceModalOpen(true)
        } else {
            toast.error('Work order not found')
        }
    }

    // Handle "Generate Invoice and Go to Invoice" - generates invoice, navigates, and completes work order
    const handleGenerateAndGoToInvoice = async () => {
        if (!dragToCompleteWorkOrder || !shopId) return

        try {
            // Check if invoice already exists
            const invoiceStatus = await getWorkOrderInvoiceStatus(dragToCompleteWorkOrder.id)
            
            if (invoiceStatus.hasInvoice && invoiceStatus.invoice) {
                // Invoice exists, sync if needed and complete work order
                if (invoiceStatus.invoice.amount_paid === 0) {
                    await syncInvoiceMutation.mutateAsync({
                        work_order_id: dragToCompleteWorkOrder.id,
                        shop_id: shopId
                    })
                    toast.success('Invoice synced with updated work order items')
                }
                
                // Mark work order as complete
                await operations.handleCompletionConfirm(
                    dragToCompleteWorkOrder,
                    false, // sendMessage
                    undefined, // customMessage
                    false // enableAutomatedMessages
                )
                toast.success('Work order completed successfully')
                
                // Navigate to invoice
                if (invoiceStatus.invoice.invoice_number) {
                    router.push(`/financials/invoices?invoice_number=${invoiceStatus.invoice.invoice_number}`)
                } else {
                    router.push('/financials/invoices')
                }
                return
            }

            // Generate new invoice
            const invoice = await createInvoiceMutation.mutateAsync({
                work_order_id: dragToCompleteWorkOrder.id,
                shop_id: shopId
            })

            if (invoice) {
                toast.success('Invoice generated successfully')
                refetch()
                
                // Mark work order as complete
                await operations.handleCompletionConfirm(
                    dragToCompleteWorkOrder,
                    false, // sendMessage
                    undefined, // customMessage
                    false // enableAutomatedMessages
                )
                toast.success('Work order completed successfully')
                
                // Navigate to invoice
                if (invoice.invoice_number) {
                    router.push(`/financials/invoices?invoice_number=${invoice.invoice_number}`)
                } else {
                    router.push('/financials/invoices')
                }
            }
        } catch (error: any) {
            console.error('Error generating invoice:', error)
            toast.error(error?.message || 'Failed to generate invoice')
        }
    }

    // Handle "Generate Invoice and Mark Complete" - generates invoice and completes work order
    const handleGenerateAndComplete = async () => {
        if (!dragToCompleteWorkOrder || !shopId) return

        try {
            // Check if invoice already exists
            const invoiceStatus = await getWorkOrderInvoiceStatus(dragToCompleteWorkOrder.id)
            
            if (invoiceStatus.hasInvoice && invoiceStatus.invoice) {
                // Invoice exists - sync if needed
                if (invoiceStatus.invoice.amount_paid === 0) {
                    await syncInvoiceMutation.mutateAsync({
                        work_order_id: dragToCompleteWorkOrder.id,
                        shop_id: shopId
                    })
                    toast.success('Invoice synced with updated work order items')
                }
            } else {
                // Generate new invoice
                const invoice = await createInvoiceMutation.mutateAsync({
                    work_order_id: dragToCompleteWorkOrder.id,
                    shop_id: shopId
                })
                toast.success('Invoice generated successfully')
                refetch()
            }

            // Complete the work order
            await operations.handleCompletionConfirm(
                dragToCompleteWorkOrder,
                false, // sendMessage
                undefined, // customMessage
                false // enableAutomatedMessages
            )
            toast.success('Work order completed successfully')
        } catch (error: any) {
            console.error('Error completing work order:', error)
            toast.error(error?.message || 'Failed to complete work order')
        }
    }

    // Loading state - show while auth is loading
    if (authLoading) {
        return <PageLoading title="Loading..." description="Checking authentication..." />
    }

    // Auth check - BEFORE error check! User will be redirected by AuthProvider
    if (!shopId || !user) {
        return <PageLoading title="Redirecting to Login..." description="Please wait while we redirect you to the login page." />
    }

    // Data loading state - only show when authenticated and loading work orders
    if (workOrdersLoading) {
        return <PageLoading title="Loading Work Orders" description="Fetching data from database..." />
    }

    // Error state - only show when authenticated but data fetch failed
    if (workOrdersError) {
        return (
            <PageError 
                title="Failed to Load Work Orders" 
                error={workOrdersError instanceof Error ? workOrdersError : undefined}
                onRetry={() => refetch()}
            />
        )
    }

    return (
    <>
        <WorkOrdersPageView
            kanbanData={kanbanData}
            selectedWorkOrder={pageState.selectedWorkOrder}
            completionWorkOrder={pageState.completionWorkOrder}
            readyWorkOrder={pageState.readyWorkOrder}
            shopId={shopId}
            isCompactView={pageState.isCompactView}
            isModalOpen={pageState.isModalOpen}
            isCreateModalOpen={pageState.isCreateModalOpen}
            isCompletionModalOpen={pageState.isCompletionModalOpen}
            isReadyModalOpen={pageState.isReadyModalOpen}
            isTemplatesModalOpen={pageState.isTemplatesModalOpen}
            isStatusTrackersModalOpen={pageState.isStatusTrackersModalOpen}
            onToggleView={pageState.handleToggleView}
            onNewWorkOrder={pageState.handleNewWorkOrder}
            onTemplatesClick={pageState.handleTemplatesClick}
            onTemplatesModalClose={pageState.handleTemplatesModalClose}
            onStatusTrackersClick={pageState.handleStatusTrackersClick}
            onStatusTrackersModalClose={pageState.handleStatusTrackersModalClose}
            onCardClick={pageState.handleCardClick}
            onModalClose={pageState.handleModalClose}
            onWorkOrderSave={operations.handleWorkOrderSave}
            onWorkOrderDelete={canDelete ? operations.handleWorkOrderDelete : undefined}
            onWorkOrderCreate={operations.handleWorkOrderCreate}
            onCreateModalClose={pageState.handleCreateModalClose}
            onCompletionModalClose={() => {
                setGeneratedInvoiceNumber(null)
                pageState.handleCompletionModalClose()
            }}
            onCompletionConfirm={handleCompletionConfirmWithSync}
            generatedInvoiceNumber={generatedInvoiceNumber}
            onWorkOrderCompletionAttempt={handleDragToCompleteAttempt}
            onReadyModalClose={pageState.handleReadyModalClose}
            onReadyConfirm={handleReadyConfirm}
            onWorkOrderReadyAttempt={pageState.handleWorkOrderReadyAttempt}
            refetch={refetch}
        />

        {/* Invoice Sync Warning Dialog */}
        <InvoiceSyncWarningDialog
            isOpen={invoiceSyncWarningOpen}
            onClose={handleCancelSyncWarning}
            onConfirm={handleConfirmSyncWithPayments}
            amountPaid={pendingCompletionData?.invoiceInfo?.amount_paid || 0}
            totalAmount={pendingCompletionData?.invoiceInfo?.total_amount || 0}
            isSyncing={syncInvoiceMutation.isPending}
        />

        {/* Drag-to-Complete Invoice Modal */}
        {dragToCompleteWorkOrder && (
            <WorkOrderCompleteInvoiceModal
                workOrder={dragToCompleteWorkOrder}
                isOpen={isCompleteInvoiceModalOpen}
                onClose={() => {
                    setIsCompleteInvoiceModalOpen(false)
                    setDragToCompleteWorkOrder(null)
                }}
                onGenerateAndGoToInvoice={handleGenerateAndGoToInvoice}
                onGenerateAndComplete={handleGenerateAndComplete}
                isGenerating={createInvoiceMutation.isPending || syncInvoiceMutation.isPending}
            />
        )}
    </>
    )
}
