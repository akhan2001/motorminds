'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { truncateText, getInitials } from '@/lib/utils/text'
import { getPriorityColor } from '@/lib/utils/status'
import { WorkOrderKanbanItem } from '../../types/work-order'

export interface WorkOrderCardProps {
    item: WorkOrderKanbanItem
    onClick?: (item: WorkOrderKanbanItem) => void
    className?: string
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ 
    item, 
    onClick,
    className = ""
}) => {
    return (
        <Card 
            className={`bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all cursor-pointer ${className}`}
            onClick={() => onClick?.(item)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium text-white line-clamp-2">
                        {truncateText(item.title, 50)}
                    </CardTitle>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)} flex-shrink-0 mt-1`} />
                </div>
                {item.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        {truncateText(item.description, 80)}
                    </p>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                {/* Customer & Vehicle Info */}
                {(item.customer || item.vehicle) && (
                    <div className="text-xs text-gray-300 mb-2">
                        {item.customer && <div className="font-medium">{item.customer}</div>}
                        {item.vehicle && <div className="text-gray-400">{item.vehicle}</div>}
                    </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                        {item.assignee && (
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-[#444] rounded-full flex items-center justify-center text-xs text-white">
                                    {getInitials(item.assignee)}
                                </div>
                                <span>{truncateText(item.assignee, 12)}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{item.date}</span>
                        </div>
                    </div>
                </div>
                
                {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag, index) => (
                            <Badge 
                                key={index} 
                                variant="secondary" 
                                className="text-xs bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Default export for easy importing
export default WorkOrderCard
