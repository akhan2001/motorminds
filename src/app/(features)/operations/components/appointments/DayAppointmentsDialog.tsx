'use client'

import React, { useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { AppointmentWithDetails } from '../../types/appointment'

interface DayAppointmentsDialogProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: string // YYYY-MM-DD
    appointments: AppointmentWithDetails[]
    onAppointmentClick: (appointment: AppointmentWithDetails) => void
    onCreateAppointment: (date: string, time?: string) => void
}

export function DayAppointmentsDialog({
    isOpen,
    onClose,
    selectedDate,
    appointments,
    onAppointmentClick,
    onCreateAppointment
}: DayAppointmentsDialogProps) {
    // Sort appointments by start_time
    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            const timeA = a.start_time || '00:00'
            const timeB = b.start_time || '00:00'
            return timeA.localeCompare(timeB)
        })
    }, [appointments])

    // Format date for display (e.g., "Monday, January 15, 2024")
    const formattedDate = useMemo(() => {
        try {
            // Parse the date string (YYYY-MM-DD) without timezone conversion
            const [year, month, day] = selectedDate.split('-').map(Number)
            const date = new Date(year, month - 1, day) // month is 0-indexed
            return format(date, 'EEEE, MMMM d, yyyy')
        } catch {
            return selectedDate
        }
    }, [selectedDate])

    const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
        onAppointmentClick(appointment)
        onClose() // Close dialog when appointment is clicked
    }

    const handleCreateAppointment = () => {
        onCreateAppointment(selectedDate)
        onClose() // Close dialog when create button is clicked
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {formattedDate}
                    </DialogTitle>
                </DialogHeader>

                {sortedAppointments.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
                        <div className="text-center space-y-2">
                            <p className="text-foreground font-medium">
                                No Appointments
                            </p>
                            <p className="text-sm text-muted-foreground">
                                No appointments scheduled for this date
                            </p>
                        </div>
                        <Button
                            onClick={handleCreateAppointment}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Appointment
                        </Button>
                    </div>
                ) : (
                    // Appointments list
                    <div className="space-y-4">
                        <ScrollArea className="max-h-[400px]">
                            <div className="space-y-2 pr-4">
                                {sortedAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        onClick={() => handleAppointmentClick(appointment)}
                                        className="p-3 rounded-lg border border-border bg-white dark:bg-card hover:bg-accent transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {appointment.start_time || 'No time'}
                                                {appointment.end_time && ` - ${appointment.end_time}`}
                                            </div>
                                            <div className={`
                                                w-2 h-2 rounded-full
                                                ${appointment.status === 'confirmed' ? 'bg-green-500' :
                                                  appointment.status === 'in_progress' ? 'bg-blue-500' :
                                                  appointment.status === 'completed' ? 'bg-emerald-500' :
                                                  appointment.status === 'cancelled' ? 'bg-red-500' :
                                                  'bg-yellow-500'}
                                            `} />
                                        </div>
                                        <div className="text-sm text-foreground mb-1">
                                            {appointment.customer_type === 'walk_in'
                                                ? 'Walk-in Customer'
                                                : appointment.customer?.customer_name || 'Unknown Customer'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {appointment.service_type}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Add Appointment Button */}
                        <div className="pt-2 border-t border-border">
                            <Button
                                onClick={handleCreateAppointment}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Appointment
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

