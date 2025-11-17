'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    Plus, 
    Calendar, 
    CalendarDays, 
    CalendarRange,
    Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MonthCard } from './MonthCard'
import { WeekCard } from './WeekCard'
import { DayCard } from './DayCard'
import type { AppointmentWithDetails } from '../../../types/appointment'
import type { AvailableSlot } from '../../../types/availability'

type CalendarViewType = 'day' | 'week' | 'month'

interface CalendarViewProps {
    selectedDate: Date
    shopId: string
    onDateSelect?: (date: string, currentView?: string) => void
    onAppointmentClick?: (appointment: AppointmentWithDetails) => void
    onCreateAppointment?: (date: string, time?: string) => void
    onSlotClick?: (date: string, time: string) => void
    onMonthChange?: (date: Date) => void
    onWeekChange?: (startDate: Date) => void
    onNewAppointment?: () => void
    onCustomersClick?: () => void
    className?: string
}

export function CalendarView({
    selectedDate,
    shopId,
    onDateSelect,
    onAppointmentClick,
    onCreateAppointment,
    onSlotClick,
    onMonthChange,
    onWeekChange,
    onNewAppointment,
    onCustomersClick,
    className
}: CalendarViewProps) {
    const [currentView, setCurrentView] = useState<CalendarViewType>('month')

    const handleSlotClick = (slot: AvailableSlot & { date: string }) => {
        onSlotClick?.(slot.date, slot.time)
    }

    const handleDateSelect = (date: string) => {
        onDateSelect?.(date, currentView)
    }

    const renderCalendarContent = () => {
        switch (currentView) {
            case 'day':
                return (
                    <DayCard
                        date={selectedDate.toISOString().split('T')[0]}
                        shopId={shopId}
                        onAppointmentClick={onAppointmentClick}
                        onSlotClick={handleSlotClick}
                        onCreateAppointment={onCreateAppointment}
                        onDateChange={onDateSelect}
                        isSelected={true}
                        compact={false}
                    />
                )
            case 'week':
                return (
                    <WeekCard
                        selectedDate={selectedDate}
                        shopId={shopId}
                        onDateSelect={handleDateSelect}
                        onAppointmentClick={onAppointmentClick}
                        onSlotClick={onSlotClick}
                        onCreateAppointment={onCreateAppointment}
                        onWeekChange={onWeekChange}
                    />
                )
            case 'month':
            default:
                return (
                    <MonthCard
                        selectedDate={selectedDate}
                        shopId={shopId}
                        onDateSelect={handleDateSelect}
                        onAppointmentClick={onAppointmentClick}
                        onCreateAppointment={onCreateAppointment}
                        onMonthChange={onMonthChange}
                    />
                )
        }
    }

    return (
        <Card className={cn("bg-background border-border h-full flex flex-col", className)}>
            <CardHeader className="flex-shrink-0 space-y-4">
                {/* Title and Actions Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Calendar className="h-6 w-6" />
                                Appointments
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Schedule and manage customer appointments, create them into work orders as well.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onCustomersClick && (
                            <Button
                                variant="outline"
                                onClick={onCustomersClick}
                                className="border-border hover:bg-accent"
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Customers
                            </Button>
                        )}
                        
                        {onNewAppointment && (
                            <Button
                                onClick={onNewAppointment}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Appointment
                            </Button>
                        )}
                    </div>
                </div>

                {/* View Controls Row */}
                <div className="flex items-center justify-end gap-4">
                    {/* View Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                            variant={currentView === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('day')}
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
                            onClick={() => setCurrentView('week')}
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
                            onClick={() => setCurrentView('month')}
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
            </CardHeader>

            <CardContent className="flex-1 min-h-0 p-0">
                {renderCalendarContent()}
            </CardContent>
        </Card>
    )
}
