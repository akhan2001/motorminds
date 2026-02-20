'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Search, MessageSquare, Filter, Maximize2, Minimize2, Lock, Loader2, Layers, Palette, Archive, PaintBucket, Package, Building2, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InfoDialogButton, workOrdersInfo } from '@/components/shared/info-dialogs'

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

    const handleMessagesClick = () => {
        window.open('/messaging', '_blank')
    }

    const handleArchivedClick = () => {
        router.push('/operations/work-orders/archived')
    }

    return (
        <div className={cn("bg-background border-b border-border flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-foreground">Work Orders</h1>
                                <InfoDialogButton
                                    title="How Work Orders Work"
                                    description="Learn about managing work orders in Motorminds"
                                    content={workOrdersInfo}
                                    tooltip="Learn about Work Orders"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage and track all work orders
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        {/* <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Find customer and create work order..."
                                className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500"
                            />
                        </div> */}

                        {/* Create Work Order Button */}
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={onNewWorkOrder}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Work Order
                        </Button>

                        {/* Compact View Toggle - Icon Only */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground w-9 h-9"
                                        onClick={onToggleView}
                                    >
                                        {isCompactView ? (
                                            <Maximize2 className="h-4 w-4" />
                                        ) : (
                                            <Minimize2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isCompactView ? 'Enlarge View' : 'Compact View'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                                    onClick={handleMessagesClick}
                                    className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Automation / Campaigns
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-popover text-popover-foreground border-border">
                                <p>Open messaging hub to view templates and queue</p>
                            </TooltipContent>
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

                    {/* Archived Work Orders Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleArchivedClick}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Archive className="h-4 w-4 mr-2" />
                        Archived Work Orders
                    </Button>

                    {/* Archived Work Orders Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/suppliers')}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Building2 className="h-4 w-4 mr-2" />
                        Suppliers
                    </Button>

                    {/* Parts & Expenses Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/expenses')}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        Parts & Expenses
                    </Button>

                    {/* Credits & Refunds Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/credits-refunds')}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Undo2 className="h-4 w-4 mr-2" />
                        Credits & Refunds
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default WorkOrderHeader
