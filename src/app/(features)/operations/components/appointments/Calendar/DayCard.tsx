'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
    Clock, 
    User, 
    Car, 
    Calendar, 
    Plus,
    AlertCircle,
    CheckCircle2,
    Clock3,
    XCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { format, isSameDay, parseISO, addDays, subDays } from 'date-fns'
import { useDayAvailability } from '../../../hooks/appointments/useAvailbility'
import { useAppointments } from '../../../hooks/appointments/useAppointments'
import type { AppointmentWithDetails, AppointmentStatus } from '../../../types/appointment'
import type { AvailableSlot } from '../../../types/availability'

interface DayCardProps {
    date: string
    shopId: string
    onAppointmentClick?: (appointment: AppointmentWithDetails) => void
    onSlotClick?: (slot: AvailableSlot & { date: string }) => void
    onCreateAppointment?: (date: string, time?: string) => void
    onDateChange?: (date: string) => void
    isSelected?: boolean
    compact?: boolean
}

const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
        case 'confirmed':
            return <CheckCircle2 className="h-3 w-3 text-green-500" />
        case 'in_progress':
            return <Clock3 className="h-3 w-3 text-blue-500" />
        case 'completed':
            return <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        case 'cancelled':
        case 'no_show':
            return <XCircle className="h-3 w-3 text-red-500" />
        default:
            return <Clock className="h-3 w-3 text-yellow-500" />
    }
}

const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
        case 'confirmed':
            return 'border-l-green-500 bg-green-500/5'
        case 'in_progress':
            return 'border-l-blue-500 bg-blue-500/5'
        case 'completed':
            return 'border-l-emerald-500 bg-emerald-500/5'
        case 'cancelled':
        case 'no_show':
            return 'border-l-red-500 bg-red-500/5'
        default:
            return 'border-l-yellow-500 bg-yellow-500/5'
    }
}

export function DayCard({ 
    date, 
    shopId, 
    onAppointmentClick, 
    onSlotClick, 
    onCreateAppointment,
    onDateChange,
    isSelected = false,
    compact = false 
}: DayCardProps) {
    const [showAllSlots, setShowAllSlots] = useState(false)
    
    // Fetch appointments for this date
    const { 
        data: appointments, 
        isLoading: appointmentsLoading 
    } = useAppointments(shopId, {
        start: date,
        end: date
    })

    // Fetch availability for this date
    const { 
        data: dayAvailability, 
        isLoading: availabilityLoading 
    } = useDayAvailability(shopId, date)

    const isLoading = appointmentsLoading || availabilityLoading
    
    // Sort appointments by time
    const sortedAppointments = useMemo(() => {
        if (!appointments) return []
        return [...appointments].sort((a, b) => {
            const timeA = a.start_time || '09:00'
            const timeB = b.start_time || '09:00'
            return timeA.localeCompare(timeB)
        })
    }, [appointments])

    // Get available slots to show
    const availableSlots = useMemo(() => {
        if (!dayAvailability?.availableSlots) return []
        const slots = dayAvailability.availableSlots.filter(slot => slot.isAvailable)
        return showAllSlots ? slots : slots.slice(0, 3)
    }, [dayAvailability?.availableSlots, showAllSlots])

    const hasMoreSlots = dayAvailability?.availableSlots && 
        dayAvailability.availableSlots.filter(slot => slot.isAvailable).length > 3

    // Format date for display
    const formattedDate = format(parseISO(date), 'EEE, MMM d')
    const isToday = isSameDay(parseISO(date), new Date())
    const dayNumber = format(parseISO(date), 'd')

    const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
        onAppointmentClick?.(appointment)
    }

    const handleSlotClick = (slot: AvailableSlot) => {
        onSlotClick?.({ ...slot, date })
    }

    const handleCreateClick = () => {
        onCreateAppointment?.(date)
    }

    const handlePreviousDay = () => {
        const currentDate = parseISO(date)
        const previousDay = subDays(currentDate, 1)
        const previousDateString = format(previousDay, 'yyyy-MM-dd')
        onDateChange?.(previousDateString)
    }

    const handleNextDay = () => {
        const currentDate = parseISO(date)
        const nextDay = addDays(currentDate, 1)
        const nextDateString = format(nextDay, 'yyyy-MM-dd')
        onDateChange?.(nextDateString)
    }

    const handleTodayClick = () => {
        const today = new Date()
        const todayString = format(today, 'yyyy-MM-dd')
        onDateChange?.(todayString)
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                {/* Loading Header */}
                <div className="pb-4 flex-shrink-0 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="flex items-center gap-1">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-4 w-24 mt-2" />
                </div>

                {/* Loading Day Content */}
                <div className="flex-1 min-h-0 px-6">
                    <ScrollArea className="h-full">
                        <div className="space-y-3">
                            {Array.from({ length: compact ? 2 : 6 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-lg border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        {!compact && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-40" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-28" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Day Header */}
            <div className="pb-4 flex-shrink-0 px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className={`
                            text-lg font-semibold text-foreground flex items-center gap-2
                            ${isToday ? 'text-blue-500' : ''}
                        `}>
                            <Calendar className="h-5 w-5" />
                            {formattedDate}
                            {isToday && (
                                <Badge variant="outline" className="ml-2 text-xs border-blue-500 text-blue-500">
                                    Today
                                </Badge>
                            )}
                        </h2>
                        
                        {/* Day Navigation Controls */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePreviousDay}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleTodayClick}
                                className="px-3 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                Today
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNextDay}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCreateClick}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                
                {sortedAppointments.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                        {sortedAppointments.length} appointment{sortedAppointments.length === 1 ? '' : 's'}
                    </div>
                )}
            </div>

            {/* Day Content */}
            <div className="flex-1 min-h-0 px-6">
                <ScrollArea className="h-full">
                    <div className="space-y-3">
                        {/* Appointments */}
                        {sortedAppointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                onClick={() => handleAppointmentClick(appointment)}
                                className={`
                                    p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200
                                    bg-card border-border hover:bg-accent/50
                                    ${getStatusColor(appointment.status || 'scheduled')}
                                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusIcon(appointment.status || 'scheduled')}
                                            <span className="text-sm font-medium text-foreground">
                                                {appointment.start_time} - {appointment.end_time}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground truncate">
                                                    {appointment.customer_type === 'walk_in' 
                                                        ? 'Walk-in Customer' 
                                                        : appointment.customer?.customer_name || 'Unknown Customer'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Car className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground truncate">
                                                    {appointment.vehicle?.year} {appointment.vehicle?.make} {appointment.vehicle?.model}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground truncate">
                                                    {appointment.service_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Available Slots */}
                        {availableSlots.length > 0 && (
                            <>
                                {sortedAppointments.length > 0 && (
                                    <div className="border-t border-border pt-4 mt-4">
                                        <div className="text-sm font-medium text-foreground mb-3">Available Times</div>
                                    </div>
                                )}
                                
                                {availableSlots.map((slot, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSlotClick(slot)}
                                        className="
                                            p-3 rounded-lg border border-dashed border-border cursor-pointer
                                            transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5
                                        "
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-foreground">
                                                {slot.time} - {slot.endTime}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                ({slot.duration}min)
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {hasMoreSlots && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAllSlots(!showAllSlots)}
                                        className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                                    >
                                        {showAllSlots ? 'Show Less' : `Show ${dayAvailability?.availableSlots?.filter(s => s.isAvailable).length || 0} More Slots`}
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Empty State */}
                        {sortedAppointments.length === 0 && availableSlots.length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium text-foreground mb-2">No appointments scheduled</p>
                                <p className="text-sm text-muted-foreground mb-4">No appointments or available slots for this day</p>
                                <Button
                                    variant="outline"
                                    onClick={handleCreateClick}
                                    className="border-border hover:bg-accent"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Appointment
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
