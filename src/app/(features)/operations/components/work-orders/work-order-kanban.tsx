'use client'

import React from 'react'
import type { WorkOrderKanbanColumn, WorkOrderKanbanItem, CompletedFilter } from '../../types/work-order'
import { DroppableColumn, ArchivedColumn } from './DragDrop'

const COMPLETED_COLUMN_CAP = 50

export interface WorkOrderKanbanProps {
    columns: WorkOrderKanbanColumn[]
    onCardClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
    className?: string
    completedFilter?: CompletedFilter
    showAllCompleted?: boolean
    onShowAllCompleted?: () => void
}

export const WorkOrderKanban: React.FC<WorkOrderKanbanProps> = ({
    columns,
    onCardClick,
    isCompactView = false,
    className = '',
    completedFilter = '30days',
    showAllCompleted = false,
    onShowAllCompleted,
}) => {
    return (
        <div className={`h-full bg-background min-h-0 ${className}`}>
            <div className="h-full flex min-h-0">
                {columns.map((column) =>
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
                            showAllCompletedButton={
                                column.id === 'completed' &&
                                completedFilter === 'all' &&
                                !showAllCompleted &&
                                column.items.length === COMPLETED_COLUMN_CAP
                            }
                            onShowAllCompleted={onShowAllCompleted}
                        />
                    )
                )}
            </div>
        </div>
    )
}

// Default export for easy importing
export default WorkOrderKanban
