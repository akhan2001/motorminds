'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'
import { formatNumber } from '@/lib/utils/currency'
import { WorkOrderKanbanColumn, WorkOrderKanbanItem } from '../../types/work-order'
import { WorkOrderCard } from './work-order-card'
import { WorkOrderCardSmall } from './work-order-card-small'

export interface WorkOrderKanbanProps {
    columns: WorkOrderKanbanColumn[]
    onCardClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
    className?: string
}

// WorkOrderCard component extracted to separate file for modularity

const KanbanColumn: React.FC<{ 
    column: WorkOrderKanbanColumn
    onCardClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
}> = ({ column, onCardClick, isCompactView = false }) => {
    return (
        <div className="h-full flex flex-col min-h-0">
            {/* Column Header - Fixed height */}
            <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color} flex-shrink-0`} />
                    <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs bg-[#2a2a2a] text-gray-400">
                        {formatNumber(column.items.length)}
                    </Badge>
                </div>
            </div>
            
            {/* Column Content - Scrollable */}
            <ScrollArea className="flex-1 min-h-0">
                <div className={`p-3 ${isCompactView ? 'space-y-2' : 'space-y-3'}`}>
                    {column.items.length > 0 ? (
                        column.items.map((item) => 
                            isCompactView ? (
                                <WorkOrderCardSmall 
                                    key={item.id} 
                                    item={item}
                                    onClick={onCardClick}
                                />
                            ) : (
                                <WorkOrderCard 
                                    key={item.id} 
                                    item={item}
                                    onClick={onCardClick}
                                />
                            )
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Clock className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No work orders</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export const WorkOrderKanban: React.FC<WorkOrderKanbanProps> = ({ 
    columns, 
    onCardClick,
    isCompactView = false,
    className = ""
}) => {
    return (
        <div className={`h-full bg-[#0d0d0d] min-h-0 ${className}`}>
            <div className="h-full grid grid-cols-3 gap-0 min-h-0">
                {columns.map((column) => (
                    <div key={column.id} className="h-full bg-[#111111] border-r border-[#2a2a2a] last:border-r-0 min-h-0">
                        <KanbanColumn column={column} onCardClick={onCardClick} isCompactView={isCompactView} />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Default export for easy importing
export default WorkOrderKanban
