'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Car } from 'lucide-react'
import { formatDate, getAppointmentStatusVariant, formatVehicleInfo } from './utils'
import type { Appointment } from './types'

interface AppointmentsListProps {
    appointments: Appointment[]
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({ appointments }) => {
    if (!appointments || appointments.length === 0) {
        return (
            <p className="text-muted-foreground dark:text-gray-400 text-center py-8">
                No appointments found
            </p>
        )
    }

    return (
        <ScrollArea className="h-[400px]">
            <div className="space-y-3">
                {appointments.map((appointment) => (
                    <div key={appointment.id} className="p-4 bg-card dark:bg-[#0f0f0f] rounded-lg border border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-foreground dark:text-white">
                                        {appointment.service_type}
                                    </h4>
                                    {appointment.status && (
                                        <Badge
                                            variant={getAppointmentStatusVariant(appointment.status)}
                                            className="capitalize"
                                        >
                                            {appointment.status}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(appointment.appointment_date)}
                                    </div>
                                    {appointment.start_time && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {appointment.start_time}
                                            {appointment.end_time && ` - ${appointment.end_time}`}
                                        </div>
                                    )}
                                    {appointment.customer_vehicles && (
                                        <div className="flex items-center gap-1">
                                            <Car className="h-3 w-3" />
                                            {formatVehicleInfo(appointment.customer_vehicles)}
                                        </div>
                                    )}
                                </div>
                                {appointment.notes && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                                        {appointment.notes}
                                    </p>
                                )}
                            </div>
                            {appointment.confirmation_code && (
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground dark:text-gray-400">
                                        Code: {appointment.confirmation_code}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
