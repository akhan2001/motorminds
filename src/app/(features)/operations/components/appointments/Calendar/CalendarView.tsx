'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
    currentView?: CalendarViewType
    onViewChange?: (view: CalendarViewType) => void
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
    currentView: externalCurrentView,
    onViewChange,
    className
}: CalendarViewProps) {
    const [internalView, setInternalView] = useState<CalendarViewType>('month')
    const currentView = externalCurrentView ?? internalView
    
    const handleViewChange = (view: CalendarViewType) => {
        if (onViewChange) {
            onViewChange(view)
        } else {
            setInternalView(view)
        }
    }

    const handleSlotClick = (slot: AvailableSlot & { date: string }) => {
        onSlotClick?.(slot.date, slot.time)
    }

    const handleDateSelect = (date: string) => {
        onDateSelect?.(date, currentView)
        
        // Auto-switch to day view when clicking a date in month view
        if (currentView === 'month') {
            handleViewChange('day')
        }
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
        <Card className={cn("bg-background border-none h-full flex flex-col", className)}>
            <CardContent className="flex-1 min-h-0 p-0">
                {renderCalendarContent()}
            </CardContent>
        </Card>
    )
}
