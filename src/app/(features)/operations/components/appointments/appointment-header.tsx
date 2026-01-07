'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, MessageSquare, Calendar, Maximize2, Minimize2, Users, CalendarDays, CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalendarViewType = 'day' | 'week' | 'month'

interface AppointmentHeaderProps {
    className?: string
    isCompactView?: boolean
    onToggleView?: () => void
    onNewAppointment?: () => void
    onCustomersClick?: () => void
    currentView?: CalendarViewType
    onViewChange?: (view: CalendarViewType) => void
}

export const AppointmentHeader: React.FC<AppointmentHeaderProps> = ({
    className,
    isCompactView = false,
    onToggleView,
    onNewAppointment,
    onCustomersClick,
    currentView = 'month',
    onViewChange
}) => {
    const router = useRouter()

    const handleMessagesClick = () => {
        window.open('/messaging', '_blank')
    }

    return (
        <div className={cn("bg-background border-b border-border flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Schedule and manage customer appointments
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        {/* New Appointment Button */}
                        {onNewAppointment && (
                            <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={onNewAppointment}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Appointment
                            </Button>
                        )}

                        {/* Compact View Toggle - Icon Only */}
                        {onToggleView && (
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
                        )}
                    </div>
                </div>
            </div>

            {/* View Toggle Buttons Bar */}
            {onViewChange && (
                <div className="px-6 pb-3">
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
                        <Button
                            variant={currentView === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange('day')}
                            className={cn(
                                "h-8 px-3",
                                currentView === 'day' 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <Calendar className="h-4 w-4 mr-1" />
                            Day
                        </Button>
                        
                        <Button
                            variant={currentView === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange('week')}
                            className={cn(
                                "h-8 px-3",
                                currentView === 'week' 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <CalendarDays className="h-4 w-4 mr-1" />
                            Week
                        </Button>
                        
                        <Button
                            variant={currentView === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onViewChange('month')}
                            className={cn(
                                "h-8 px-3",
                                currentView === 'month' 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <CalendarRange className="h-4 w-4 mr-1" />
                            Month
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AppointmentHeader
