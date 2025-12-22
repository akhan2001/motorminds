import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { WorkOrderKanbanItem, WorkOrderWithDetails } from '../../types/work-order'
import { transformWorkOrderToKanbanItem } from '../../lib/work-order-transformers'

/**
 * Custom hook for managing work order page state
 * Handles modal states, view state, selected work order, and URL parameter synchronization
 */
export function useWorkOrderPageState(
    workOrders: WorkOrderWithDetails[] | undefined
) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
    const [isStatusTrackersModalOpen, setIsStatusTrackersModalOpen] = useState(false)
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)

    // View state
    const [isCompactView, setIsCompactView] = useState(false)

    // Selected work order states
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderKanbanItem | null>(null)
    const [completionWorkOrder, setCompletionWorkOrder] = useState<WorkOrderWithDetails | null>(null)

    // Handle URL parameter changes to open/close modal
    useEffect(() => {
        const workOrderId = searchParams?.get('id')

        if (workOrderId && workOrders) {
            // Find the work order in the current data
            const foundWorkOrder = workOrders.find(wo => wo.id === workOrderId)

            if (foundWorkOrder) {
                // Convert to kanban item format
                const kanbanItem = transformWorkOrderToKanbanItem(foundWorkOrder)
                setSelectedWorkOrder(kanbanItem)
                setIsModalOpen(true)
            } else {
                // Work order not found, remove from URL
                router.replace('/operations/work-orders')
            }
        } else {
            // No work order ID in URL, close modal
            setIsModalOpen(false)
            setSelectedWorkOrder(null)
        }
    }, [searchParams, workOrders, router])

    // Handler functions
    const handleCardClick = (item: WorkOrderKanbanItem) => {
        // Update URL without navigation
        router.push(`/operations/work-orders?id=${item.id}`)
    }

    const handleModalClose = () => {
        // Remove work order ID from URL without navigation
        router.replace('/operations/work-orders')
    }

    const handleToggleView = () => {
        setIsCompactView(prev => !prev)
    }

    const handleNewWorkOrder = () => {
        setIsCreateModalOpen(true)
    }

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false)
    }

    const handleTemplatesClick = () => {
        setIsTemplatesModalOpen(true)
    }

    const handleTemplatesModalClose = () => {
        setIsTemplatesModalOpen(false)
    }

    const handleStatusTrackersClick = () => {
        setIsStatusTrackersModalOpen(true)
    }

    const handleStatusTrackersModalClose = () => {
        setIsStatusTrackersModalOpen(false)
    }

    const handleCompletionModalClose = () => {
        setIsCompletionModalOpen(false)
        setCompletionWorkOrder(null)
    }

    const handleWorkOrderCompletionAttempt = (item: WorkOrderKanbanItem) => {
        // Find the full work order details from the workOrders array
        const fullWorkOrder = workOrders?.find(wo => wo.id === item.id)
        if (fullWorkOrder) {
            setCompletionWorkOrder(fullWorkOrder)
            setIsCompletionModalOpen(true)
        }
    }

    return {
        // Modal states
        isCreateModalOpen,
        isModalOpen,
        isTemplatesModalOpen,
        isStatusTrackersModalOpen,
        isCompletionModalOpen,

        // View state
        isCompactView,

        // Selected work orders
        selectedWorkOrder,
        completionWorkOrder,

        // Handlers
        handleCardClick,
        handleModalClose,
        handleToggleView,
        handleNewWorkOrder,
        handleCreateModalClose,
        handleTemplatesClick,
        handleTemplatesModalClose,
        handleStatusTrackersClick,
        handleStatusTrackersModalClose,
        handleCompletionModalClose,
        handleWorkOrderCompletionAttempt,
    }
}

