'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Palette } from 'lucide-react'
import { truncateText, getInitials } from '@/lib/utils/text'
import { getPriorityColor } from '@/lib/utils/status'
import { WorkOrderKanbanItem } from '../../types/work-order'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useStatusTrackerPresets } from '../../hooks/use-status-trackers'
import { useAuth } from '../../hooks/use-auth'
import { useUpdateWorkOrder } from '../../hooks/use-work-orders'
import type { StatusTracker } from '../../types/status-tracker'
import { toast } from 'sonner'

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
    const { shopId } = useAuth()
    const { data: presets = [] } = useStatusTrackerPresets(shopId || '')
    const updateWorkOrderMutation = useUpdateWorkOrder()
    const [isUpdating, setIsUpdating] = useState(false)

    // Get border color from status tracker if available
    const borderColor = item.status_tracker?.color || undefined
    const borderStyle = borderColor ? { borderLeftColor: borderColor, borderLeftWidth: '4px' } : {}

    // Sort presets by display_order
    const sortedPresets = [...presets].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        return orderA - orderB
    })

    const handleStatusTrackerSelect = async (tracker: StatusTracker | null, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click
        if (isUpdating) return

        try {
            setIsUpdating(true)
            await updateWorkOrderMutation.mutateAsync({
                id: item.id,
                data: {
                    status_tracker: tracker,
                },
            })
            toast.success(tracker ? `Status tracker set to ${tracker.name}` : 'Status tracker removed')
        } catch (error) {
            console.error('Failed to update status tracker:', error)
            toast.error('Failed to update status tracker')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Card 
            className={`bg-white dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#3a3a3a] transition-all cursor-pointer relative ${className}`}
            style={borderStyle}
            onClick={() => onClick?.(item)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium text-foreground dark:text-white line-clamp-2 flex-1 pr-2">
                        {truncateText(item.title, 50)}
                    </CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)} flex-shrink-0 mt-1`} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-accent dark:hover:bg-[#2a2a2a]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Palette className="h-3 w-3 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align="end" 
                                className="w-56 bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground dark:text-gray-400">
                                    Status Tracker
                                </div>
                                <DropdownMenuSeparator className="bg-border dark:bg-[#2a2a2a]" />
                                <DropdownMenuItem
                                    onClick={(e) => handleStatusTrackerSelect(null, e)}
                                    className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] bg-transparent" />
                                        <span>None</span>
                                    </div>
                                </DropdownMenuItem>
                                {sortedPresets.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.id}
                                        onClick={(e) => handleStatusTrackerSelect({ name: preset.name, color: preset.color }, e)}
                                        className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <div
                                                className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                                style={{ backgroundColor: preset.color }}
                                            />
                                            <span>{preset.name}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {item.description && (
                    <p className="text-xs text-muted-foreground dark:text-gray-400 line-clamp-2 mt-1">
                        {truncateText(item.description, 80)}
                    </p>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                {/* Customer & Vehicle Info */}
                {(item.customer || item.vehicle) && (
                    <div className="text-xs text-foreground dark:text-gray-300 mb-2">
                        {item.customer && <div className="font-medium">{item.customer}</div>}
                        {item.vehicle && <div className="text-muted-foreground dark:text-gray-400">{item.vehicle}</div>}
                    </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-500">
                    <div className="flex items-center gap-3">
                        {item.assignee && (
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-secondary dark:bg-[#444] rounded-full flex items-center justify-center text-xs text-secondary-foreground dark:text-white">
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
                                className="text-xs bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#3a3a3a]"
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
