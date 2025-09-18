'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MessageSquare, Filter, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkOrderHeaderProps {
    className?: string
    isCompactView?: boolean
    onToggleView?: () => void
    onNewWorkOrder?: () => void
}

export const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
    className,
    isCompactView = false,
    onToggleView,
    onNewWorkOrder
}) => {
    return (
        <div className={cn("bg-[#0d0d0d] border-b border-[#2a2a2a] flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Work Orders</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                Manage and track all work orders
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* Messages Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                        </Button>

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

            {/* Search & Filters Bar */}
            <div className="px-6 pb-3">
                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search work orders by customer, vehicle, or description..."
                            className="pl-10 bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-red-500"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex items-center gap-2">
                        {/* <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button> */}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
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
        </div>
    )
}

export default WorkOrderHeader
