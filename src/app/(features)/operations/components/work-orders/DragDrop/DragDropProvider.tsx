'use client'

import React, { useState, useCallback } from 'react'
import { DragDropContext, DragDropContextType } from './DragDropContext'
import { WorkOrderKanbanItem, WorkOrderStatus, WorkOrder } from '../../../types/work-order'
import { useUpdateWorkOrder, useUpdateWorkOrderStatus } from '../../../hooks/use-work-orders'
import { toast } from 'sonner'
import { RevertWorkOrderDialog } from '../revert-work-order-dialog'
import { workOrderService } from '../../../lib/work-order-service'

interface DragDropProviderProps {
    children: React.ReactNode
    onWorkOrderUpdate?: (workOrderId: string, newStatus: string) => void
    onWorkOrderCompletionAttempt?: (item: WorkOrderKanbanItem) => void
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ 
    children, 
    onWorkOrderUpdate,
    onWorkOrderCompletionAttempt
}) => {
    const [draggedItem, setDraggedItem] = useState<WorkOrderKanbanItem | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [revertDialogOpen, setRevertDialogOpen] = useState(false)
    const [pendingRevertItem, setPendingRevertItem] = useState<WorkOrderKanbanItem | null>(null)
    const [revertWarning, setRevertWarning] = useState<string | undefined>()
    
    const updateWorkOrderMutation = useUpdateWorkOrder()
    const updateWorkOrderStatusMutation = useUpdateWorkOrderStatus()

    const startDrag = useCallback((item: WorkOrderKanbanItem) => {
        setDraggedItem(item)
        setIsDragging(true)
    }, [])

    const endDrag = useCallback(() => {
        setDraggedItem(null)
        setDragOverColumn(null)
        setDragOverIndex(null)
        setIsDragging(false)
    }, [])

    const setDragOver = useCallback((columnId: string | null, index: number = 0) => {
        setDragOverColumn(columnId)
        setDragOverIndex(index)
    }, [])

    const canDragItem = useCallback((item: WorkOrderKanbanItem) => {
        // Allow dragging from all columns, including completed
        return true
    }, [])

    const handleDrop = useCallback(async (item: WorkOrderKanbanItem, targetColumn: string, targetIndex: number) => {
        // Map column IDs to status values
        const statusMap: Record<string, WorkOrderStatus> = {
            'pending': 'pending',
            'in-progress': 'in_progress',
            'completed': 'completed'
        }
        
        const newStatus = statusMap[targetColumn]
        
        if (!newStatus) {
            console.warn('Invalid target column:', targetColumn)
            toast.error('Invalid drop target')
            return
        }

        // Check if we're reverting from completed
        const isRevertingFromCompleted = item.status === 'completed' && newStatus !== 'completed'

        // If reverting from completed, show confirmation dialog
        if (isRevertingFromCompleted) {
            // Check if revert is allowed
            const canRevert = await workOrderService.canRevertFromCompleted(item.id)
            
            if (!canRevert.canRevert) {
                toast.error(canRevert.reason || 'Cannot revert this work order')
                return
            }

            // Get work order details for dialog
            const workOrder = await workOrderService.getWorkOrderById(item.id)
            const hasInvoice = !!workOrder?.invoice_id
            
            setRevertWarning(canRevert.reason)
            setPendingRevertItem({ ...item, targetStatus: newStatus, hasInvoice } as any)
            setRevertDialogOpen(true)
            return
        }

        // If dropping into completed column, trigger completion modal
        if (newStatus === 'completed') {
            onWorkOrderCompletionAttempt?.(item)
            return
        }

        try {
            // Prepare update data with timestamps
            const updateData: Partial<WorkOrder> = { 
                status: newStatus,
                updated_at: new Date().toISOString()
            }

            // Set started_at if moving to in_progress (only if not already set)
            if (newStatus === 'in_progress') {
                const currentWorkOrder = await workOrderService.getWorkOrderById(item.id)
                if (!currentWorkOrder?.started_at) {
                    updateData.started_at = new Date().toISOString()
                }
            }

            // Update the work order status
            await updateWorkOrderMutation.mutateAsync({
                id: item.id,
                data: updateData
            })

            // Notify parent component to refetch data
            onWorkOrderUpdate?.(item.id, newStatus)
            
            // Success feedback with proper status names
            const statusNames: Record<string, string> = {
                'pending': 'Estimates',
                'in_progress': 'In Progress',
                'completed': 'Completed'
            }
            
            toast.success(`Work order moved to ${statusNames[newStatus]}`)
        } catch (error) {
            console.error('Failed to update work order status:', error)
            toast.error('Failed to update work order status')
        }
    }, [updateWorkOrderMutation, onWorkOrderUpdate, onWorkOrderCompletionAttempt])

    const handleRevertConfirm = useCallback(async () => {
        if (!pendingRevertItem) return

        try {
            const targetStatus = (pendingRevertItem as any).targetStatus || 'in_progress'
            
            // Use status update mutation which handles revert logic
            await updateWorkOrderStatusMutation.mutateAsync({
                id: pendingRevertItem.id,
                status: targetStatus
            })

            // Notify parent component to refetch data
            onWorkOrderUpdate?.(pendingRevertItem.id, targetStatus)
            
            toast.success('Work order reverted to In Progress')
            setRevertDialogOpen(false)
            setPendingRevertItem(null)
            setRevertWarning(undefined)
        } catch (error) {
            console.error('Failed to revert work order:', error)
            toast.error('Failed to revert work order')
        }
    }, [pendingRevertItem, updateWorkOrderStatusMutation, onWorkOrderUpdate])

    const handleRevertCancel = useCallback(() => {
        setRevertDialogOpen(false)
        setPendingRevertItem(null)
        setRevertWarning(undefined)
    }, [])

    const contextValue: DragDropContextType = {
        draggedItem,
        dragOverColumn,
        dragOverIndex,
        isDragging,
        startDrag,
        endDrag,
        setDragOver,
        handleDrop,
        canDragItem,
        onWorkOrderCompletionAttempt
    }

  return (
    <>
      <DragDropContext.Provider value={contextValue}>
        {children}
      </DragDropContext.Provider>
      
      <RevertWorkOrderDialog
        isOpen={revertDialogOpen}
        onClose={handleRevertCancel}
        onConfirm={handleRevertConfirm}
        workOrderTitle={pendingRevertItem?.title}
        hasInvoice={!!pendingRevertItem && (pendingRevertItem as any).hasInvoice}
        warningMessage={revertWarning}
        isReverting={updateWorkOrderStatusMutation.isPending}
      />
    </>
  )
}