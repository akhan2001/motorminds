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
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'

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

    const handleGenerateInvoice = async (workOrderId: string) => {
        if (!shopId) {
            toast.error('Shop ID is required')
            return
        }

        try {
            const invoice = await createInvoiceMutation.mutateAsync({
                work_order_id: workOrderId,
                shop_id: shopId
            })

            if (invoice) {
                toast.success('Invoice generated successfully')
                refetch() // Refresh work orders to show invoice status
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
                    await createInvoiceMutation.mutateAsync({
                        work_order_id: pageState.completionWorkOrder.id,
                        shop_id: shopId
                    })
                    toast.success('Invoice generated successfully')
                } catch (invoiceError: any) {
                    console.error('Error generating invoice:', invoiceError)
                    toast.error(invoiceError?.message || 'Failed to generate invoice')
                    // Continue with completion even if invoice generation fails
                }
            }

            // Proceed with completion
            await operations.handleCompletionConfirm(
                pageState.completionWorkOrder,
                sendMessage,
                customMessage,
                enableAutomatedMessages
            )
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

    // Loading state - show while auth is loading
    if (authLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading...</p>
                                <p className="text-muted-foreground text-sm">Checking authentication...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Auth check - BEFORE error check! User will be redirected by AuthProvider
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Redirecting to Login...</p>
                                <p className="text-muted-foreground text-sm">
                                    Please wait while we redirect you to the login page.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Data loading state - only show when authenticated and loading work orders
    if (workOrdersLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Work Orders</p>
                                <p className="text-muted-foreground text-sm">Fetching data from database...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state - only show when authenticated but data fetch failed
    if (workOrdersError) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Failed to Load Work Orders</p>
                                <p className="text-muted-foreground text-sm mb-3">
                                    {workOrdersError instanceof Error ? workOrdersError.message : 'Unknown error occurred'}
                                </p>
                                <button
                                    onClick={() => refetch()}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
    <>
        <WorkOrdersPageView
            kanbanData={kanbanData}
            selectedWorkOrder={pageState.selectedWorkOrder}
            completionWorkOrder={pageState.completionWorkOrder}
            shopId={shopId}
            isCompactView={pageState.isCompactView}
            isModalOpen={pageState.isModalOpen}
            isCreateModalOpen={pageState.isCreateModalOpen}
            isCompletionModalOpen={pageState.isCompletionModalOpen}
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
            onCompletionModalClose={pageState.handleCompletionModalClose}
            onCompletionConfirm={handleCompletionConfirmWithSync}
            onWorkOrderCompletionAttempt={pageState.handleWorkOrderCompletionAttempt}
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
    </>
    )
}
