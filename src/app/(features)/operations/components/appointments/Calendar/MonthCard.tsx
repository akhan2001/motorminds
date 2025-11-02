'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths,
    parseISO
} from 'date-fns'
import { useAppointments } from '../../../hooks/appointments/useAppointments'
import type { AppointmentWithDetails, AppointmentStatus } from '../../../types/appointment'

interface MonthCardProps {
    selectedDate: Date
    shopId: string
    onDateSelect?: (date: string) => void
    onAppointmentClick?: (appointment: AppointmentWithDetails) => void
    onCreateAppointment?: (date: string) => void
    onMonthChange?: (date: Date) => void
}

const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
        case 'confirmed':
            return 'bg-green-500'
        case 'in_progress':
            return 'bg-blue-500'
        case 'completed':
            return 'bg-emerald-500'
        case 'cancelled':
        case 'no_show':
            return 'bg-red-500'
        default:
            return 'bg-yellow-500'
    }
}

export function MonthCard({ 
    selectedDate, 
    shopId, 
    onDateSelect, 
    onAppointmentClick, 
    onCreateAppointment,
    onMonthChange 
}: MonthCardProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate)
    
    // Get the month range for appointments
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    // Fetch appointments for the entire month view
    const { 
        data: appointments, 
        isLoading 
    } = useAppointments(shopId, {
        start: `${calendarStart.getFullYear()}-${String(calendarStart.getMonth() + 1).padStart(2, '0')}-${String(calendarStart.getDate()).padStart(2, '0')}`,
        end: `${calendarEnd.getFullYear()}-${String(calendarEnd.getMonth() + 1).padStart(2, '0')}-${String(calendarEnd.getDate()).padStart(2, '0')}`
    })

    // Generate calendar days
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    })

    // Group appointments by date
    const appointmentsByDate = useMemo(() => {
        if (!appointments) return {}
        
        return appointments.reduce((acc, appointment) => {
            const dateKey = appointment.appointment_date
            if (!acc[dateKey]) {
                acc[dateKey] = []
            }
            acc[dateKey].push(appointment)
            return acc
        }, {} as Record<string, AppointmentWithDetails[]>)
    }, [appointments])

    const handlePreviousMonth = () => {
        const newMonth = subMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        onMonthChange?.(newMonth)
    }

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1)
        setCurrentMonth(newMonth)
        onMonthChange?.(newMonth)
    }

    // Helper function to convert Date to YYYY-MM-DD string without timezone issues
    const formatDateToString = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const handleDateClick = (date: Date) => {
        const dateString = formatDateToString(date)
        onDateSelect?.(dateString)
    }

    const handleCreateClick = (date: Date, e: React.MouseEvent) => {
        e.stopPropagation()
        const dateString = formatDateToString(date)
        onCreateAppointment?.(dateString)
    }

    const renderDayCell = (date: Date) => {
        // Use local date to avoid timezone issues
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`
        const dayAppointments = appointmentsByDate[dateString] || []
        const isCurrentMonth = isSameMonth(date, currentMonth)
        const isToday = isSameDay(date, new Date())
        const isSelected = isSameDay(date, selectedDate)
        const dayNumber = format(date, 'd')

        return (
            <div
                key={dateString}
                onClick={() => handleDateClick(date)}
                className={`
                    relative p-1 min-h-[120px] border border-[#2a2a2a] cursor-pointer
                    transition-all duration-200 hover:bg-[#1a1a1a] group
                    ${isCurrentMonth ? 'bg-[#0d0d0d]' : 'bg-[#0a0a0a] opacity-40'}
                    ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
                    ${isToday ? 'bg-blue-500/5 border-blue-500/50' : ''}
                `}
            >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-1 px-1">
                    <span className={`
                        text-xs font-bold
                        ${!isCurrentMonth ? 'text-gray-600' : isToday ? 'text-blue-400' : 'text-white'}
                    `}>
                        {dayNumber}
                    </span>
                    
                    {isCurrentMonth && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleCreateClick(date, e)}
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-whit hover:bg-[#2a2a2a]"
                        >
                            <Plus className="h-2 w-2" />
                        </Button>
                    )}
                </div>

                {/* Today Indicator */}
                {isToday && (
                    <div className="absolute top-1 right-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                )}

                {/* Appointment Components */}
                {isCurrentMonth && dayAppointments.length > 0 && (
                    <div className="space-y-0.5 px-1">
                        {/* Show first 3-4 appointments as mini components */}
                        {dayAppointments.slice(0, 4).map((appointment, index) => (
                            <div
                                key={appointment.id}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAppointmentClick?.(appointment)
                                }}
                                className={`
                                    text-xs p-1 rounded border-l-2 truncate cursor-pointer
                                    bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a]
                                    transition-all duration-200 hover:scale-[1.02]
                                    ${getStatusColor(appointment.status || 'scheduled').replace('bg-', 'border-l-')}
                                `}
                                title={`${appointment.start_time} - ${appointment.customer_type === 'walk_in' ? 'Walk-in Customer' : appointment.customer?.customer_name || 'Unknown'} (${appointment.service_type})`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-[10px] truncate">
                                            {appointment.start_time} {appointment.customer_type === 'walk_in' ? 'Walk-in' : appointment.customer?.customer_name || 'Unknown'}
                                        </div>
                                        <div className="text-gray-400 text-[9px] truncate">
                                            {appointment.service_type}
                                        </div>
                                    </div>
                                    <div className={`
                                        w-1.5 h-1.5 rounded-full ml-1 flex-shrink-0
                                        ${getStatusColor(appointment.status || 'scheduled')}
                                    `} />
                                </div>
                            </div>
                        ))}
                        
                        {/* Show count if more appointments */}
                        {dayAppointments.length > 4 && (
                            <div className="text-[9px] text-gray-400 font-medium px-1 py-0.5 bg-[#1a1a1a] rounded text-center">
                                +{dayAppointments.length - 4} more
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                    <Skeleton className="h-6 w-32 bg-[#2a2a2a]" />
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: 42 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 bg-[#2a2a2a]" />
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-full flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePreviousMonth}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const today = new Date()
                                setCurrentMonth(today)
                                onMonthChange?.(today)
                                const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                                onDateSelect?.(todayString)
                            }}
                            className="px-3 h-8 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            Today
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNextMonth}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    {/* Week Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 group">
                        {calendarDays.map(renderDayCell)}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
