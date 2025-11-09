'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Search, MessageSquare, Filter, Maximize2, Minimize2, Lock, Loader2, Layers, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagingAvailability } from '../../hooks/use-work-order-messaging'

interface WorkOrderHeaderProps {
    className?: string
    isCompactView?: boolean
    onToggleView?: () => void
    onNewWorkOrder?: () => void
    onTemplatesClick?: () => void
    onStatusTrackersClick?: () => void
}

export const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
    className,
    isCompactView = false,
    onToggleView,
    onNewWorkOrder,
    onTemplatesClick,
    onStatusTrackersClick
}) => {
    const router = useRouter()
    const messagingAvailability = useMessagingAvailability()

    const handleMessagesClick = () => {
        if (messagingAvailability.isAvailable) {
            router.push('/messages')
        }
    }

    return (
        <div className={cn("bg-background border-b border-border flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Work Orders</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage and track all work orders
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Find customer and create work order..."
                                className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500"
                            />
                        </div>

                        {/* Create Work Order Button */}
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={onNewWorkOrder}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Work Order
                        </Button>
                    </div>
                </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="px-6 pb-3">
                <div className="flex items-center gap-2">
                    {/* Messages Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!messagingAvailability.isAvailable}
                                    onClick={handleMessagesClick}
                                    className={cn(
                                        "bg-transparent border-border text-muted-foreground",
                                        messagingAvailability.isAvailable
                                            ? "hover:bg-accent hover:text-foreground"
                                            : "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {messagingAvailability.isLoading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : !messagingAvailability.isAvailable ? (
                                        <Lock className="h-4 w-4 mr-2" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                    )}
                                    Messages
                                </Button>
                            </TooltipTrigger>
                            {!messagingAvailability.isAvailable && !messagingAvailability.isLoading && (
                                <TooltipContent className="bg-popover text-popover-foreground border-border">
                                    <p>Contact admin to set up messaging</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    {/* Items Templates Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onTemplatesClick}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        Items Templates
                    </Button>

                    {/* Status Trackers Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onStatusTrackersClick}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Palette className="h-4 w-4 mr-2" />
                        Status Trackers
                    </Button>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={onToggleView}
                    >
                        {isCompactView ? (
                            <>
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Enlarge
                            </>
                        ) : (
                            <>
                                <Minimize2 className="h-4 w-4 mr-2" />
                                Compact
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default WorkOrderHeader
