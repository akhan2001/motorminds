'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Search, MessageSquare, Calendar, Filter, Maximize2, Minimize2, Lock, Loader2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    className
}) => {

    return (
        <div className={cn("bg-background dark:bg-[#0d0d0d] border-b border-border dark:border-[#2a2a2a] flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        {/* Left Section - Title */}
                        <div className="flex items-center gap-6">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
                                    Mia AI Suite
                                </h1>
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                    Meet Mia, Motorminds Intelligent Assistant. Mia can help you with a variety of tasks, from answering questions to helping you with your business.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AppointmentHeader
