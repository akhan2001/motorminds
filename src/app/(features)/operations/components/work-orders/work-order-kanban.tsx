'use client'

import React from 'react'
import { WorkOrderKanbanColumn, WorkOrderKanbanItem } from '../../types/work-order'
import { DroppableColumn, ArchivedColumn } from './DragDrop'

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
        <div className={`h-full bg-background min-h-0 ${className}`}>
            <div className="h-full flex min-h-0">
                {columns.map((column) => (
                    column.id === 'archived' ? (
                        <ArchivedColumn
                            key={column.id}
                            column={column}
                            onCardClick={onCardClick}
                            isCompactView={isCompactView}
                        />
                    ) : (
                        <DroppableColumn 
                            key={column.id} 
                            column={column} 
                            onCardClick={onCardClick} 
                            isCompactView={isCompactView} 
                        />
                    )
                ))}
            </div>
        </div>
    )
}

// Default export for easy importing
export default WorkOrderKanban
