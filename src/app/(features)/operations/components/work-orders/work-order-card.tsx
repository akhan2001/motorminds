'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useStatusTrackerPresets } from '../../hooks/use-status-trackers'
import { useAuth } from '../../hooks/use-auth'
import { useUpdateWorkOrder } from '../../hooks/use-work-orders'
import type { StatusTracker } from '../../types/status-tracker'
import { MAX_WORK_ORDER_STATUS_TRACKERS } from '../../lib/status-tracker-constants'
import { toast } from 'sonner'
import { formatPhoneNumber } from '@/lib/utils/formatters'

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

    // Get status trackers array (normalize to array)
    // Handle both old format (single object) and new format (array)
    const normalizeTrackers = (tracker: any): StatusTracker[] => {
        if (!tracker) return []
        if (Array.isArray(tracker)) return tracker
        // Handle old format: single object
        if (tracker && typeof tracker === 'object' && tracker.name && tracker.color) {
            return [tracker]
        }
        return []
    }
    const statusTrackers = normalizeTrackers(item.status_tracker)
    const trackerCount = statusTrackers.length
    const isMaxReached = trackerCount >= MAX_WORK_ORDER_STATUS_TRACKERS

    // Sort presets by display_order
    const sortedPresets = [...presets].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        return orderA - orderB
    })

    // Check if a preset is selected
    const isPresetSelected = (presetId: string): boolean => {
        const preset = sortedPresets.find(p => p.id === presetId)
        if (!preset) return false
        return statusTrackers.some(
            tracker => tracker.name === preset.name && tracker.color === preset.color
        )
    }

    // Toggle tracker selection
    const handleStatusTrackerToggle = async (presetId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click
        if (isUpdating) return

        const preset = sortedPresets.find(p => p.id === presetId)
        if (!preset) return

        const tracker: StatusTracker = {
            name: preset.name,
            color: preset.color,
        }

        const isSelected = isPresetSelected(presetId)
        let newTrackers: StatusTracker[] | null

        if (isSelected) {
            // Remove tracker
            newTrackers = statusTrackers.filter(
                t => !(t.name === tracker.name && t.color === tracker.color)
            )
            newTrackers = newTrackers.length > 0 ? newTrackers : null
        } else {
            // Add tracker (if not at max)
            if (!isMaxReached) {
                newTrackers = [...statusTrackers, tracker]
            } else {
                return // Can't add more
            }
        }

        try {
            setIsUpdating(true)
            await updateWorkOrderMutation.mutateAsync({
                id: item.id,
                data: {
                    status_tracker: newTrackers,
                },
            })
            if (isSelected) {
                toast.success(`Status tracker "${tracker.name}" removed`)
            } else {
                toast.success(`Status tracker "${tracker.name}" added`)
            }
        } catch (error) {
            console.error('Failed to update status tracker:', error)
            toast.error('Failed to update status tracker')
        } finally {
            setIsUpdating(false)
        }
    }

    // Clear all trackers
    const handleClearAll = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isUpdating || statusTrackers.length === 0) return

        try {
            setIsUpdating(true)
            await updateWorkOrderMutation.mutateAsync({
                id: item.id,
                data: {
                    status_tracker: null,
                },
            })
            toast.success('All status trackers removed')
        } catch (error) {
            console.error('Failed to clear status trackers:', error)
            toast.error('Failed to clear status trackers')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Card 
            className={`bg-white dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] hover:border-accent dark:hover:border-[#3a3a3a] transition-all cursor-pointer relative ${className}`}
            onClick={() => onClick?.(item)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-foreground dark:text-white line-clamp-2">
                            {truncateText(item.title, 50)}
                        </CardTitle>
                        {/* Status Tracker Badges */}
                        {statusTrackers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {statusTrackers.map((tracker, index) => (
                                    <TooltipProvider key={index}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs px-1.5 py-0.5 h-5 bg-secondary dark:bg-[#2a2a2a] text-secondary-foreground dark:text-gray-300 cursor-default"
                                                >
                                                    <div
                                                        className="w-2 h-2 rounded mr-1 flex-shrink-0"
                                                        style={{ backgroundColor: tracker.color }}
                                                    />
                                                    <span className="truncate max-w-[60px]">{tracker.name}</span>
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#1f1f1f] text-popover-foreground dark:text-white">
                                                <span className="text-sm">{tracker.name}</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        )}
                    </div>
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
                                {/* Header with count */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground dark:text-gray-400">
                                    Status Trackers {trackerCount > 0 && `(${trackerCount}/${MAX_WORK_ORDER_STATUS_TRACKERS})`}
                                </div>
                                <DropdownMenuSeparator className="bg-border dark:bg-[#2a2a2a]" />
                                
                                {/* Preset list with checkboxes */}
                                <div className="max-h-[300px] overflow-y-auto">
                                    {sortedPresets.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-muted-foreground dark:text-gray-400 text-center">
                                            No presets available
                                        </div>
                                    ) : (
                                        sortedPresets.map((preset) => {
                                            const isSelected = isPresetSelected(preset.id)
                                            const isDisabled = !isSelected && isMaxReached

                                            return (
                                                <DropdownMenuItem
                                                    key={preset.id}
                                                    onClick={(e) => !isDisabled && handleStatusTrackerToggle(preset.id, e)}
                                                    disabled={isDisabled}
                                                    className={`text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer ${
                                                        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            disabled={isDisabled}
                                                            className="h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none flex-shrink-0"
                                                        />
                                                        <div
                                                            className="w-4 h-4 rounded border border-border dark:border-[#2a2a2a] flex-shrink-0"
                                                            style={{ backgroundColor: preset.color }}
                                                        />
                                                        <span className="flex-1 text-sm">{preset.name}</span>
                                                    </div>
                                                </DropdownMenuItem>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Clear All option */}
                                {statusTrackers.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator className="bg-border dark:bg-[#2a2a2a]" />
                                        <DropdownMenuItem
                                            onClick={handleClearAll}
                                            className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a] cursor-pointer text-sm"
                                        >
                                            Clear All
                                        </DropdownMenuItem>
                                    </>
                                )}
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
                        {item.customer && (
                            <div className="font-medium">
                                {item.customer}
                                {item.customer_phone && (
                                    <span className="text-muted-foreground dark:text-gray-400"> {formatPhoneNumber(item.customer_phone)}</span>
                                )}
                            </div>
                        )}
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
