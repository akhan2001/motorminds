'use client'

import { useMemo } from 'react'
import { useAuth } from '../hooks/use-auth'
import { useWorkOrdersWithDetails } from '../hooks/use-work-orders'
import { useWorkOrderStats } from '../hooks/use-work-order-stats'
import { useWorkOrderPageState } from '../hooks/use-work-order-page-state'
import { useWorkOrderOperations } from '../hooks/use-work-order-operations'
import { transformWorkOrdersToKanbanColumns } from '../lib/work-order-transformers'
import { WorkOrdersPageView } from './WorkOrdersPageView'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'

/**
 * WorkOrdersPageContent - Container Component
 * Handles authentication, data fetching, and state management
 * Passes data to the presentational component
 */
export function WorkOrdersPageContent() {
    // Authentication
    const { user, shopId, isLoading: authLoading } = useAuth()

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
            onWorkOrderDelete={operations.handleWorkOrderDelete}
            onWorkOrderCreate={operations.handleWorkOrderCreate}
            onCreateModalClose={pageState.handleCreateModalClose}
            onCompletionModalClose={pageState.handleCompletionModalClose}
            onCompletionConfirm={(sendMessage, customMessage, enableAutomatedMessages) =>
                operations.handleCompletionConfirm(
                    pageState.completionWorkOrder,
                    sendMessage,
                    customMessage,
                    enableAutomatedMessages
                )
            }
            onWorkOrderCompletionAttempt={pageState.handleWorkOrderCompletionAttempt}
            refetch={refetch}
        />
    )
}
