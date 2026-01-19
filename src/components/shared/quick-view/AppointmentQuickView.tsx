'use client'

import React from 'react'
import { CalendarDays, User, Car, Clock, FileText, Loader2, X, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAppointment } from '@/app/(features)/operations/hooks/appointments/useAppointments'
import { formatDate } from '@/lib/utils/date'

interface AppointmentQuickViewProps {
    appointmentId: string
    isOpen: boolean
    onClose: () => void
}

export function AppointmentQuickView({ appointmentId, isOpen, onClose }: AppointmentQuickViewProps) {
    const { data: appointment, isLoading, error } = useAppointment(appointmentId)

    const getStatusBadge = (status: string | undefined) => {
        if (!status) return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Unknown</Badge>
        
        const statusStyles: Record<string, string> = {
            scheduled: 'bg-blue-600 text-white border-blue-600',
            confirmed: 'bg-green-600 text-white border-green-600',
            in_progress: 'bg-yellow-600 text-white border-yellow-600',
            completed: 'bg-green-600 text-white border-green-600',
            cancelled: 'bg-red-600 text-white border-red-600',
            no_show: 'bg-red-600 text-white border-red-600',
        }
        
        return (
            <Badge className={statusStyles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}>
                {status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
        )
    }

    const formatTime = (time: string | undefined) => {
        if (!time) return null
        try {
            const [hours, minutes] = time.split(':')
            const hour = parseInt(hours, 10)
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const hour12 = hour % 12 || 12
            return `${hour12}:${minutes} ${ampm}`
        } catch {
            return time
        }
    }

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <CalendarDays className="h-5 w-5 text-purple-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Loading Appointment...
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (error || !appointment) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                    <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                    <CalendarDays className="h-5 w-5 text-red-500" />
                                </div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    Appointment Not Found
                                </DialogTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="text-center py-12 text-muted-foreground">
                        Unable to load appointment details.
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const isWalkIn = appointment.customer_type === 'walk_in'
    const vehicleInfo = appointment.vehicle || appointment.walk_in_vehicle_info

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a] [&>button:last-child]:hidden">
                <DialogHeader className="flex-shrink-0 pb-4 border-b border-border dark:border-[#2a2a2a]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted dark:bg-[#1a1a1a]">
                                <CalendarDays className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-foreground dark:text-white">
                                    {appointment.service_type}
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
                                    {formatDate(appointment.appointment_date)}
                                    {appointment.confirmation_code && ` • #${appointment.confirmation_code}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusBadge(appointment.status)}
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 ml-2">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {/* Schedule Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Schedule</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Date</p>
                                    <p className="text-foreground dark:text-white font-medium">{formatDate(appointment.appointment_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">Start Time</p>
                                    <p className="text-foreground dark:text-white font-medium">{formatTime(appointment.start_time) || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">End Time</p>
                                    <p className="text-foreground dark:text-white font-medium">{formatTime(appointment.end_time) || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Customer Card */}
                    <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-lg font-semibold text-foreground dark:text-white">Customer</h3>
                                {isWalkIn && (
                                    <Badge variant="outline" className="ml-2 text-xs border-orange-500 text-orange-500">
                                        Walk-in
                                    </Badge>
                                )}
                            </div>
                            {isWalkIn ? (
                                <div className="text-center py-4">
                                    <p className="text-foreground dark:text-white font-medium">Walk-in Customer</p>
                                    <p className="text-muted-foreground dark:text-gray-400 text-sm">No customer record</p>
                                </div>
                            ) : appointment.customer ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Name</p>
                                        <p className="text-foreground dark:text-white font-medium">{appointment.customer.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Phone</p>
                                        <p className="text-foreground dark:text-gray-300">{appointment.customer.customer_phone || 'N/A'}</p>
                                    </div>
                                    {appointment.customer.customer_email && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground dark:text-gray-500">Email</p>
                                            <p className="text-foreground dark:text-gray-300">{appointment.customer.customer_email}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground dark:text-gray-400 text-sm">No customer information</p>
                            )}
                        </div>
                    </Card>

                    {/* Vehicle Card */}
                    {vehicleInfo && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Vehicle</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Vehicle</p>
                                        <p className="text-foreground dark:text-white font-medium">
                                            {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                                        </p>
                                    </div>
                                    {vehicleInfo.license_plate && (
                                        <div>
                                            <p className="text-xs text-muted-foreground dark:text-gray-500">License Plate</p>
                                            <p className="text-foreground dark:text-gray-300">{vehicleInfo.license_plate}</p>
                                        </div>
                                    )}
                                    {vehicleInfo.color && (
                                        <div>
                                            <p className="text-xs text-muted-foreground dark:text-gray-500">Color</p>
                                            <p className="text-foreground dark:text-gray-300">{vehicleInfo.color}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Work Order Card (if linked) */}
                    {appointment.work_order && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wrench className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Linked Work Order</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Work Order #</p>
                                        <p className="text-foreground dark:text-white font-medium">#{appointment.work_order.work_order_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">Status</p>
                                        <p className="text-foreground dark:text-gray-300 capitalize">{appointment.work_order.status?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Notes Card */}
                    {appointment.notes && (
                        <Card className="bg-slate-50 dark:bg-[#131313] border-border dark:border-[#333333]">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Notes</h3>
                                </div>
                                <p className="text-foreground dark:text-white text-sm whitespace-pre-wrap">{appointment.notes}</p>
                            </div>
                        </Card>
                    )}

                    {/* Created Info */}
                    <div className="pt-2 text-xs text-muted-foreground dark:text-gray-500">
                        Created: {formatDate(appointment.created_at)}
                        {appointment.created_by_customer && ' (by customer)'}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
