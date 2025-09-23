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
    XCircle
} from 'lucide-react'
import { format, isSameDay, parseISO } from 'date-fns'
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

    if (isLoading) {
        return (
            <Card className={`bg-[#1a1a1a] border-[#2a2a2a] ${compact ? 'h-32' : 'h-96'}`}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-24 bg-[#2a2a2a]" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full bg-[#2a2a2a]" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`
            bg-[#1a1a1a] border-[#2a2a2a] transition-all duration-200
            ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-[#3a3a3a]'}
            ${compact ? 'h-32' : 'h-96'}
        `}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className={`
                        text-white ${compact ? 'text-sm' : 'text-base'}
                        ${isToday ? 'text-blue-400' : ''}
                    `}>
                        {compact ? dayNumber : formattedDate}
                        {isToday && (
                            <Badge variant="outline" className="ml-2 text-xs border-blue-500 text-blue-400">
                                Today
                            </Badge>
                        )}
                    </CardTitle>
                    
                    {!compact && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCreateClick}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                
                {!compact && sortedAppointments.length > 0 && (
                    <div className="text-xs text-gray-400">
                        {sortedAppointments.length} appointment{sortedAppointments.length === 1 ? '' : 's'}
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                <ScrollArea className={compact ? 'h-16' : 'h-80'}>
                    <div className="space-y-2">
                        {/* Appointments */}
                        {sortedAppointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                onClick={() => handleAppointmentClick(appointment)}
                                className={`
                                    p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200
                                    bg-[#0d0d0d] border-[#2a2a2a] hover:bg-[#1a1a1a]
                                    ${getStatusColor(appointment.status || 'scheduled')}
                                `}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getStatusIcon(appointment.status || 'scheduled')}
                                            <span className="text-xs font-medium text-white">
                                                {appointment.start_time} - {appointment.end_time}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-white truncate">
                                                    {appointment.customer.customer_name}
                                                </span>
                                            </div>
                                            
                                            {!compact && (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <Car className="h-3 w-3 text-gray-400" />
                                                        <span className="text-xs text-gray-300 truncate">
                                                            {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span className="text-xs text-gray-300 truncate">
                                                            {appointment.service_type}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Available Slots */}
                        {!compact && availableSlots.length > 0 && (
                            <>
                                {sortedAppointments.length > 0 && (
                                    <div className="border-t border-[#2a2a2a] pt-2 mt-2">
                                        <div className="text-xs text-gray-400 mb-2">Available Times</div>
                                    </div>
                                )}
                                
                                {availableSlots.map((slot, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleSlotClick(slot)}
                                        className="
                                            p-2 rounded-lg border border-dashed border-[#2a2a2a] cursor-pointer
                                            transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5
                                        "
                                    >
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-300">
                                                {slot.time} - {slot.endTime}
                                            </span>
                                            <span className="text-xs text-gray-500">
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
                                        className="w-full text-xs text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                                    >
                                        {showAllSlots ? 'Show Less' : `Show ${dayAvailability?.availableSlots?.filter(s => s.isAvailable).length || 0} More Slots`}
                                    </Button>
                                )}
                            </>
                        )}

                        {/* Empty State */}
                        {sortedAppointments.length === 0 && availableSlots.length === 0 && !compact && (
                            <div className="text-center py-8">
                                <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No appointments or available slots</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCreateClick}
                                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Create Appointment
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
