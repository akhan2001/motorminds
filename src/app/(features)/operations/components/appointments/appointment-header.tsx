'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Search, MessageSquare, Calendar, Filter, Maximize2, Minimize2, Lock, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagingAvailability } from '../../hooks/use-work-order-messaging'

interface AppointmentHeaderProps {
    className?: string
    isCompactView?: boolean
    onToggleView?: () => void
    onNewAppointment?: () => void
    onCustomersClick?: () => void
    searchValue?: string
    onSearchChange?: (value: string) => void
}

export const AppointmentHeader: React.FC<AppointmentHeaderProps> = ({
    className,
    isCompactView = false,
    onToggleView,
    onNewAppointment,
    onCustomersClick,
    searchValue = '',
    onSearchChange
}) => {

    return (
        <div className={cn("bg-[#0d0d0d] border-b border-[#2a2a2a] flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Appointments
                            </h1>
                            <p className="text-sm text-gray-400 mt-1">
                                Schedule and manage customer appointments, create them into work orders as well.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters Bar
            <div className="px-6 pb-3">
                <div className="flex items-center gap-3">
                    {/* Search Bar 
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search appointments by customer, service, or date..."
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-10 bg-[#1a1a1a] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filter Buttons 
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>
            </div> */}
        </div>
    )
}

export default AppointmentHeader
