'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
            className={`bg-white dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#3a3a3a] transition-all cursor-pointer relative ${className}`}
            onClick={() => onClick?.(item)}
        >
            <CardContent className="p-3">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-1">
                        {/* Vehicle Details - First - Most Prominent (Highest Weight & Brightest Color) */}
                        {item.vehicle && (
                            <div className="text-xs font-semibold text-foreground dark:text-white truncate mb-0.5">
                                {truncateText(item.vehicle, 28)}
                            </div>
                        )}
                        
                        {/* Customer Info - Second - Medium Prominence */}
                        {item.customer && (
                            <div className="text-xs text-foreground dark:text-gray-300 truncate mb-0.5 font-medium">
                                {truncateText(item.customer, 28)}
                            </div>
                        )}
                        
                        {/* Title - Third - Less Prominent */}
                        <h4 className="text-xs font-medium text-foreground dark:text-gray-300 truncate">
                            {truncateText(item.title, 30)}
                        </h4>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)} flex-shrink-0 mt-0.5`} />
                </div>

                {/* Labor / Services / Parts - Fourth */}
                {item.first_item && (
                    <div className="mb-2">
                        <Badge 
                            variant="secondary" 
                            className="text-xs bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#3a3a3a] capitalize"
                        >
                            {item.first_item.item_type}: {truncateText(item.first_item.description, 25)}
                        </Badge>
                    </div>
                )}
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map((tag, index) => (
                            <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#3a3a3a]"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Bottom Row */}
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-500">
                    <div className="flex items-center gap-2">
                        {item.assignee && (
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-secondary dark:bg-[#444] rounded-full flex items-center justify-center text-xs text-secondary-foreground dark:text-white">
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
