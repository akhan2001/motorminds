'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { 
    format, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameDay, 
    addWeeks, 
    subWeeks,
    parseISO
} from 'date-fns'
import { useAppointments } from '../../../hooks/appointments/useAppointments'
import { useWeekAvailability } from '../../../hooks/appointments/useAvailbility'
import type { AppointmentWithDetails, AppointmentStatus } from '../../../types/appointment'

interface WeekCardProps {
    selectedDate: Date
    shopId: string
    onDateSelect?: (date: string) => void
    onAppointmentClick?: (appointment: AppointmentWithDetails) => void
    onSlotClick?: (date: string, time: string) => void
    onCreateAppointment?: (date: string, time?: string) => void
    onWeekChange?: (startDate: Date) => void
}

const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00'
]

const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
        case 'confirmed':
            return 'bg-green-500 border-green-400'
        case 'in_progress':
            return 'bg-blue-500 border-blue-400'
        case 'completed':
            return 'bg-emerald-500 border-emerald-400'
        case 'cancelled':
        case 'no_show':
            return 'bg-red-500 border-red-400'
        default:
            return 'bg-yellow-500 border-yellow-400'
    }
}

export function WeekCard({ 
    selectedDate, 
    shopId, 
    onDateSelect, 
    onAppointmentClick, 
    onSlotClick,
    onCreateAppointment,
    onWeekChange 
}: WeekCardProps) {
    const [currentWeek, setCurrentWeek] = useState(selectedDate)
    
    // Get week boundaries
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Start on Monday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
    
    // Generate week days
    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: weekEnd
    })

    // Fetch appointments for the week
    const { 
        data: appointments, 
        isLoading: appointmentsLoading 
    } = useAppointments(shopId, {
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd')
    })

    // Fetch availability for the week
    const { 
        data: weekAvailability, 
        isLoading: availabilityLoading 
    } = useWeekAvailability(shopId, format(weekStart, 'yyyy-MM-dd'))

    const isLoading = appointmentsLoading || availabilityLoading

    // Group appointments by date and time
    const appointmentsByDateTime = useMemo(() => {
        if (!appointments) return {}
        
        const grouped = appointments.reduce((acc, appointment) => {
            const dateKey = appointment.appointment_date
            const timeKey = appointment.start_time || '09:00'
            
            // Try to match to nearest time slot
            const appointmentTime = timeKey.substring(0, 5) // Get HH:MM format
            let matchedTimeSlot = appointmentTime
            
            // If exact match not found, find closest time slot
            if (!TIME_SLOTS.includes(appointmentTime)) {
                const appointmentMinutes = parseInt(appointmentTime.split(':')[0]) * 60 + parseInt(appointmentTime.split(':')[1])
                let closestSlot = TIME_SLOTS[0]
                let closestDiff = Math.abs(appointmentMinutes - (parseInt(TIME_SLOTS[0].split(':')[0]) * 60 + parseInt(TIME_SLOTS[0].split(':')[1])))
                
                TIME_SLOTS.forEach(slot => {
                    const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1])
                    const diff = Math.abs(appointmentMinutes - slotMinutes)
                    if (diff < closestDiff) {
                        closestDiff = diff
                        closestSlot = slot
                    }
                })
                matchedTimeSlot = closestSlot
            }
            
            const key = `${dateKey}-${matchedTimeSlot}`
            
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(appointment)
            return acc
        }, {} as Record<string, AppointmentWithDetails[]>)
        
        return grouped
    }, [appointments])

    // Get available slots by date and time
    const availabilityByDateTime = useMemo(() => {
        if (!weekAvailability) return {}
        
        const result: Record<string, boolean> = {}
        weekAvailability.days.forEach(day => {
            day.availableSlots.forEach(slot => {
                const key = `${day.date}-${slot.time}`
                result[key] = slot.isAvailable
            })
        })
        return result
    }, [weekAvailability])

    const handlePreviousWeek = () => {
        const newWeek = subWeeks(currentWeek, 1)
        setCurrentWeek(newWeek)
        onWeekChange?.(newWeek)
    }

    const handleNextWeek = () => {
        const newWeek = addWeeks(currentWeek, 1)
        setCurrentWeek(newWeek)
        onWeekChange?.(newWeek)
    }

    const handleDateClick = (date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd')
        onDateSelect?.(dateString)
    }

    const handleSlotClickInternal = (date: Date, time: string) => {
        const dateString = format(date, 'yyyy-MM-dd')
        const key = `${dateString}-${time}`
        
        // Check if there are appointments in this slot
        const slotAppointments = appointmentsByDateTime[key]
        if (slotAppointments && slotAppointments.length > 0) {
            // If there's an appointment, show it
            onAppointmentClick?.(slotAppointments[0])
        } else {
            // If it's an available slot, allow creation
            const isAvailable = availabilityByDateTime[key]
            if (isAvailable) {
                onSlotClick?.(dateString, time)
            }
        }
    }

    const renderTimeSlot = (time: string, date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd')
        const key = `${dateString}-${time}`
        const slotAppointments = appointmentsByDateTime[key] || []
        const isAvailable = availabilityByDateTime[key]
        const isToday = isSameDay(date, new Date())
        const isSelected = isSameDay(date, selectedDate)
        

        if (slotAppointments.length > 0) {
            // Show appointment
            const appointment = slotAppointments[0]
            return (
                <div
                    key={key}
                    onClick={() => onAppointmentClick?.(appointment)}
                    className={`
                        p-2 m-1 rounded-lg border cursor-pointer transition-all duration-200
                        ${getStatusColor(appointment.status || 'scheduled')}
                        hover:shadow-lg hover:scale-[1.02]
                    `}
                >
                    <div className="text-xs font-medium text-white truncate">
                        {appointment.customer_type === 'walk_in' 
                            ? 'Walk-in Customer' 
                            : appointment.customer?.customer_name || 'Unknown Customer'}
                    </div>
                    <div className="text-xs text-white/80 truncate">
                        {appointment.service_type}
                    </div>
                    {slotAppointments.length > 1 && (
                        <div className="text-xs text-white/60">
                            +{slotAppointments.length - 1} more
                        </div>
                    )}
                </div>
            )
        } else if (isAvailable) {
            // Show available slot
            return (
                <div
                    key={key}
                    onClick={() => handleSlotClickInternal(date, time)}
                    className={`
                        p-2 m-1 rounded-lg border border-dashed border-border cursor-pointer
                        transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5
                        ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : ''}
                        group
                    `}
                >
                    <div className="flex items-center justify-center h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-blue-500" />
                    </div>
                </div>
            )
        } else {
            // Show unavailable slot
            return (
                <div
                    key={key}
                    className="p-2 m-1 rounded-lg bg-muted/30 border border-border opacity-30"
                >
                    <div className="h-8"></div>
                </div>
            )
        }
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                {/* Loading Header */}
                <div className="pb-4 flex-shrink-0 px-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-40" />
                        <div className="flex items-center gap-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Loading Week Content */}
                <div className="flex-1 min-h-0 px-6">
                    <ScrollArea className="h-full">
                        <div className="grid grid-cols-8 gap-1">
                            {/* Time column and day headers */}
                            {Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={i} className="h-12" />
                            ))}
                            
                            {/* Time slots */}
                            {Array.from({ length: 88 }).map((_, i) => (
                                <Skeleton key={i + 8} className="h-16" />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Week Navigation Header */}
            <div className="pb-4 flex-shrink-0 px-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Week of {format(weekStart, 'MMM d, yyyy')}
                    </h2>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePreviousWeek}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const today = new Date()
                                setCurrentWeek(today)
                                onWeekChange?.(today)
                                onDateSelect?.(format(today, 'yyyy-MM-dd'))
                            }}
                            className="px-3 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            This Week
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextWeek}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Week Calendar Content */}
            <div className="flex-1 min-h-0 px-6">
                <ScrollArea className="h-full">
                    <div className="grid grid-cols-8 gap-1">
                        {/* Time column header */}
                        <div className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
                            Time
                        </div>
                        
                        {/* Day headers */}
                        {weekDays.map((day) => {
                            const isToday = isSameDay(day, new Date())
                            const isSelected = isSameDay(day, selectedDate)
                            
                            return (
                                <div
                                    key={format(day, 'yyyy-MM-dd')}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        text-center text-xs font-medium py-2 border-b border-border cursor-pointer
                                        transition-colors duration-200 hover:bg-accent
                                        ${isToday ? 'text-blue-500' : 'text-muted-foreground'}
                                        ${isSelected ? 'bg-blue-500/10 text-blue-500' : ''}
                                    `}
                                >
                                    <div>{format(day, 'EEE')}</div>
                                    <div className={`mt-1 ${isToday ? 'text-blue-500 font-bold' : ''}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Time slots */}
                        {TIME_SLOTS.map((time) => (
                            <div key={`time-slots-${time}`} className="contents">
                                {/* Time label */}
                                <div className="text-center text-xs text-muted-foreground py-4 border-r border-border">
                                    {time}
                                </div>
                                
                                {/* Day slots */}
                                {weekDays.map((day) => renderTimeSlot(time, day))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
