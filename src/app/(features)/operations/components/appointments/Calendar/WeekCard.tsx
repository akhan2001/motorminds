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
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00'
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
        
        return appointments.reduce((acc, appointment) => {
            const dateKey = appointment.appointment_date
            const timeKey = appointment.start_time || '09:00'
            const key = `${dateKey}-${timeKey}`
            
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(appointment)
            return acc
        }, {} as Record<string, AppointmentWithDetails[]>)
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
                        {appointment.customer.customer_name}
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
                        p-2 m-1 rounded-lg border border-dashed border-[#2a2a2a] cursor-pointer
                        transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5
                        ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : ''}
                        group
                    `}
                >
                    <div className="flex items-center justify-center h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="h-4 w-4 text-blue-400" />
                    </div>
                </div>
            )
        } else {
            // Show unavailable slot
            return (
                <div
                    key={key}
                    className="p-2 m-1 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] opacity-30"
                >
                    <div className="h-8"></div>
                </div>
            )
        }
    }

    if (isLoading) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                    <Skeleton className="h-6 w-40 bg-[#2a2a2a]" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-8 gap-2">
                        {Array.from({ length: 96 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 bg-[#2a2a2a]" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Week of {format(weekStart, 'MMM d, yyyy')}
                    </CardTitle>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePreviousWeek}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
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
                            className="px-3 h-8 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            This Week
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextWeek}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-8 gap-1">
                        {/* Time column header */}
                        <div className="text-center text-xs font-medium text-gray-400 py-2 border-b border-[#2a2a2a]">
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
                                        text-center text-xs font-medium py-2 border-b border-[#2a2a2a] cursor-pointer
                                        transition-colors duration-200 hover:bg-[#2a2a2a]
                                        ${isToday ? 'text-blue-400' : 'text-gray-400'}
                                        ${isSelected ? 'bg-blue-500/10 text-blue-300' : ''}
                                    `}
                                >
                                    <div>{format(day, 'EEE')}</div>
                                    <div className={`mt-1 ${isToday ? 'text-blue-400 font-bold' : ''}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Time slots */}
                        {TIME_SLOTS.map((time) => (
                            <div key={`time-slots-${time}`} className="contents">
                                {/* Time label */}
                                <div className="text-center text-xs text-gray-400 py-4 border-r border-[#2a2a2a]">
                                    {time}
                                </div>
                                
                                {/* Day slots */}
                                {weekDays.map((day) => renderTimeSlot(time, day))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
