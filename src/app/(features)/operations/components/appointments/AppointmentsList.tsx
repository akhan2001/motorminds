import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import type { AppointmentWithDetails } from '../../types/appointment'

interface AppointmentsListProps {
    selectedDate: Date
    appointments: AppointmentWithDetails[]
    onAddAppointment: () => void
    onAppointmentClick: (appointment: AppointmentWithDetails) => void
    onCancelAppointment?: (appointmentId: string) => void
    cancellingAppointmentId?: string
}

export function AppointmentsList({
    selectedDate,
    appointments,
    onAddAppointment,
    onAppointmentClick,
    onCancelAppointment,
    cancellingAppointmentId
}: AppointmentsListProps) {
    // Sort appointments by start time
    const sortedAppointments = [...appointments].sort((a, b) => {
        const timeA = a.start_time || '00:00'
        const timeB = b.start_time || '00:00'
        return timeA.localeCompare(timeB)
    })

    return (
        <Card className="bg-slate-50 dark:bg-card border-border h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground">
                        {format(selectedDate, 'EEEE, MMMM d')}
                    </h3>
                    <Button 
                        onClick={onAddAppointment}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                    </Button>
                </div>
            </div>
            
            {/* Scrollable appointments list */}
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                        {sortedAppointments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No appointments scheduled for this date</p>
                                <p className="text-sm mt-2">Click "Add" to create one</p>
                            </div>
                        ) : (
                            sortedAppointments.map((appointment) => {
                                const canCancel = appointment.status !== 'cancelled' && 
                                                appointment.status !== 'completed' && 
                                                appointment.status !== 'in_progress'
                                const isCancelling = cancellingAppointmentId === appointment.id

                                return (
                                    <div
                                        key={appointment.id}
                                        className="relative p-3 rounded-lg border border-border bg-white dark:bg-card hover:bg-accent transition-colors group"
                                    >
                                        {/* Cancel button - only show on hover and if cancellable */}
                                        {canCancel && onCancelAppointment && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onCancelAppointment(appointment.id)
                                                }}
                                                disabled={isCancelling}
                                                className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}

                                        {/* Main clickable area */}
                                        <div
                                            onClick={() => onAppointmentClick(appointment)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between mb-2 pr-6">
                                                <div className="text-sm font-medium text-foreground">
                                                    {appointment.start_time} - {appointment.end_time}
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
                                                {appointment.customer.customer_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-1">
                                                {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {appointment.service_type}
                                            </div>
                                            {appointment.notes && (
                                                <div className="text-xs text-muted-foreground mt-2 italic">
                                                    {appointment.notes}
                                                </div>
                                            )}
                                            {appointment.status === 'cancelled' && (
                                                <div className="text-xs text-red-400 mt-2 font-medium">
                                                    CANCELLED
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>
        </Card>
    )
}
