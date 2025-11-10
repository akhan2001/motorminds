'use client'

import React, { useState, useCallback } from 'react'
import { DragDropContext, DragDropContextType } from './DragDropContext'
import { WorkOrderKanbanItem, WorkOrderStatus, WorkOrder } from '../../../types/work-order'
import { useUpdateWorkOrder } from '../../../hooks/use-work-orders'
import { toast } from 'sonner'

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
    
    const updateWorkOrderMutation = useUpdateWorkOrder()

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
        // Prevent dragging FROM completed column
        return item.status !== 'completed'
    }, [])

    const handleDrop = useCallback(async (item: WorkOrderKanbanItem, targetColumn: string, targetIndex: number) => {
        // Map column IDs to status values
        const statusMap: Record<string, WorkOrderStatus> = {
            'pending': 'pending',
            'in-progress': 'in_progress',
            'ready': 'ready',
            'completed': 'completed'
        }
        
        const newStatus = statusMap[targetColumn]
        
        if (!newStatus) {
            console.warn('Invalid target column:', targetColumn)
            toast.error('Invalid drop target')
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

            // Set started_at if moving to in_progress
            if (newStatus === 'in_progress') {
                updateData.started_at = new Date().toISOString()
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
                'ready': 'Ready',
                'completed': 'Completed'
            }
            
            toast.success(`Work order moved to ${statusNames[newStatus]}`)
        } catch (error) {
            console.error('Failed to update work order status:', error)
            toast.error('Failed to update work order status')
        }
    }, [updateWorkOrderMutation, onWorkOrderUpdate, onWorkOrderCompletionAttempt])

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
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  )
}