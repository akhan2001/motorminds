import { createContext, useContext } from 'react'
import { WorkOrderKanbanItem } from '../../../types/work-order'

export interface DragDropState {
    draggedItem: WorkOrderKanbanItem | null
    dragOverColumn: string | null
    dragOverIndex: number | null
    isDragging: boolean
}

export interface DragDropActions {
    startDrag: (item: WorkOrderKanbanItem) => void
    endDrag: () => void
    setDragOver: (columnId: string | null, index?: number) => void
    handleDrop: (item: WorkOrderKanbanItem, targetColumn: string, targetIndex: number) => Promise<void>
    canDragItem: (item: WorkOrderKanbanItem) => boolean
    onWorkOrderCompletionAttempt?: (item: WorkOrderKanbanItem) => void
}

export interface DragDropContextType extends DragDropState, DragDropActions {}

export const DragDropContext = createContext<DragDropContextType | undefined>(undefined)

export const useDragDrop = () => {
    const context = useContext(DragDropContext)
    if (!context) {
        throw new Error('useDragDrop must be used within a DragDropProvider')
    }
    return context
}