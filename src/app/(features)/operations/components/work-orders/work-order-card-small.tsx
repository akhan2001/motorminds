'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { truncateText, getInitials } from '@/lib/utils/text'
import { getPriorityColor } from '@/lib/utils/status'
import { WorkOrderKanbanItem } from '../../types/work-order'

export interface WorkOrderCardSmallProps {
    item: WorkOrderKanbanItem
    onClick?: (item: WorkOrderKanbanItem) => void
    className?: string
}

export const WorkOrderCardSmall: React.FC<WorkOrderCardSmallProps> = ({ 
    item, 
    onClick,
    className = ""
}) => {
    return (
        <Card 
            className={`bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all cursor-pointer ${className}`}
            onClick={() => onClick?.(item)}
        >
            <CardContent className="p-3">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-white truncate">
                            {truncateText(item.title, 30)}
                        </h4>
                        {item.vehicle && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                {truncateText(item.vehicle, 25)}
                            </p>
                        )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)} flex-shrink-0 mt-0.5`} />
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        {item.assignee && (
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-[#444] rounded-full flex items-center justify-center text-xs text-white">
                                    {getInitials(item.assignee)}
                                </div>
                                <span className="truncate max-w-[60px]">{truncateText(item.assignee, 8)}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="h-2.5 w-2.5" />
                        <span className="text-xs">{item.date}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Default export for easy importing
export default WorkOrderCardSmall
