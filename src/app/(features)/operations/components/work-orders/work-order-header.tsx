'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Maximize2, Minimize2, Layers, Archive, Package, Building2, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageSettingsDialog } from '@/components/shared/page-settings'
import { WorkOrderSettingsDialog } from './WorkOrderSettingsDialog'
import { SearchBar } from '@/app/(features)/admin/components/shared/SearchBar'
import type { CompletedFilter } from '../../../types/work-order'

interface WorkOrderHeaderProps {
    className?: string
    completedFilter?: CompletedFilter
    onCompletedFilterChange?: (value: CompletedFilter) => void
    onSettingsChange?: () => void
    isCompactView?: boolean
    onToggleView?: () => void
    onNewWorkOrder?: () => void
    onTemplatesClick?: () => void
    onStatusTrackersClick?: () => void
    searchTerm?: string
    onSearchChange?: (value: string) => void
}

export const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
    className,
    completedFilter = 'all',
    onCompletedFilterChange,
    onSettingsChange,
    isCompactView = false,
    onToggleView,
    onNewWorkOrder,
    onTemplatesClick,
    onStatusTrackersClick,
    searchTerm = '',
    onSearchChange
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
                                <PageSettingsDialog
                                    title="Work Order Settings"
                                    tooltip="Work order settings"
                                >
                                    <WorkOrderSettingsDialog
                                        completedFilter={completedFilter}
                                        onCompletedFilterChange={onCompletedFilterChange ?? (() => {})}
                                        onSettingsChange={onSettingsChange}
                                    />
                                </PageSettingsDialog>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage and track all work orders
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {onSearchChange && (
                            <div className="w-80">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={onSearchChange}
                                    placeholder="Search by work order #, customer, vehicle, title..."
                                    className="h-10"
                                />
                            </div>
                        )}

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
                    {/* Messages Button
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
                    </TooltipProvider>*/}

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

                    {/* Status Trackers Button
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onStatusTrackersClick}
                        className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Palette className="h-4 w-4 mr-2" />
                        Status Trackers
                    </Button> */}

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
