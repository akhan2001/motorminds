'use client'

import React from 'react'
import { WorkOrderKanbanColumn, WorkOrderKanbanItem } from '../../types/work-order'
import { DroppableColumn, DragOverlay } from './DragDrop'

export interface WorkOrderKanbanProps {
    columns: WorkOrderKanbanColumn[]
    onCardClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
    className?: string
}


export const WorkOrderKanban: React.FC<WorkOrderKanbanProps> = ({ 
    columns, 
    onCardClick,
    isCompactView = false,
    className = ""
}) => {
    return (
        <div className={`h-full bg-[#0d0d0d] min-h-0 ${className}`}>
            <div className="h-full flex min-h-0">
                {columns.map((column) => (
                    <DroppableColumn 
                        key={column.id} 
                        column={column} 
                        onCardClick={onCardClick} 
                        isCompactView={isCompactView} 
                    />
                ))}
            </div>
            <DragOverlay />
        </div>
    )
}

// Default export for easy importing
export default WorkOrderKanban
