'use client'

import React, { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
    Calendar, 
    Clock, 
    User, 
    Car, 
    MessageSquare,
    Edit,
    FileText,
    AlertTriangle,
    Settings,
    Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { AppointmentMessageModal } from './AppointmentMessageModal'
import type { AppointmentWithDetails } from '../../types/appointment'

interface AppointmentDetailsSheetProps {
    appointment: AppointmentWithDetails
    isOpen: boolean
    onClose: () => void
    onEdit?: (appointment: AppointmentWithDetails) => void
    onCancel?: (appointmentId: string) => void
    onMessageCustomer?: (customer: AppointmentWithDetails['customer']) => void
    onCreateWorkOrder?: (appointmentId: string) => void
    isCreatingWorkOrder?: boolean
}

export function AppointmentDetailsSheet({
    appointment,
    isOpen,
    onClose,
    onEdit,
    onCancel,
    onMessageCustomer,
    onCreateWorkOrder,
    isCreatingWorkOrder = false
}: AppointmentDetailsSheetProps) {
    const [showMessageModal, setShowMessageModal] = useState(false)
    const router = useRouter()
    
    // Handle message modal
    const handleShowMessageModal = () => {
        setShowMessageModal(true)
    }

    const handleCloseMessageModal = () => {
        setShowMessageModal(false)
    }

    const handleMessageConfirm = (sendMessage: boolean, customMessage?: string) => {
        setShowMessageModal(false)
        if (sendMessage && customMessage) {
            // Message was sent successfully
            console.log('Message sent:', customMessage)
        }
    }

    // Handle navigation to work order
    const handleViewWorkOrder = () => {
        router.push(`/operations/work-orders?id=${appointment.work_order?.id}`)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-500'
            case 'in_progress': return 'bg-blue-500'
            case 'completed': return 'bg-emerald-500'
            case 'cancelled': return 'bg-red-500'
            case 'no_show': return 'bg-orange-500'
            default: return 'bg-yellow-500' // scheduled
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'confirmed'
            case 'in_progress': return 'created into workorder'
            case 'completed': return 'created into workorder'
            case 'cancelled': return 'cancelled'
            case 'no_show': return 'cancelled'
            default: return 'schedule'
        }
    }

    const canEdit = appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'in_progress'
    const canCancel = appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'in_progress'
    
    // Check if work order actually exists (not just an empty object)
    const workOrderExists = appointment.work_order && appointment.work_order.id
    
    const canCreateWorkOrder = appointment.status !== 'cancelled' && 
                               appointment.status !== 'in_progress' && 
                               appointment.status !== 'completed' && 
                               !workOrderExists
                               
    const hasWorkOrder = workOrderExists || 
                        appointment.status === 'in_progress' || 
                        appointment.status === 'completed'

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-lg md:max-w-xl">
                    <SheetHeader>
                        <SheetTitle className="text-foreground flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Appointment Details
                        </SheetTitle>
                    </SheetHeader>

                    <div className="mt-6">
                        <ScrollArea className="h-[calc(100vh-8rem)]">
                            <div className="space-y-6 pr-4 pb-12">
                                {/* Status and Service Info */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status || 'scheduled')}`} />
                                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-border">
                                                {getStatusLabel(appointment.status || 'scheduled')}
                                            </Badge>
                                        </div>
                                        {appointment.confirmation_code && (
                                            <div className="text-xs text-muted-foreground">
                                                Code: {appointment.confirmation_code}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-lg font-medium text-foreground">
                                        {appointment.service_type}
                                    </div>
                                </div>

                                <Separator className="bg-border" />

                                {/* Date and Time */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-blue-400" />
                                        <span className="text-blue-500 dark:text-blue-300">Schedule</span>
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-sm">Date:</span>
                                            <span className="text-foreground text-sm">
                                                {format(new Date(appointment.appointment_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                                            </span>
                                        </div>
                                        {appointment.start_time && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">Time:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.start_time}
                                                    {appointment.end_time && ` - ${appointment.end_time}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator className="bg-border" />

                                {/* Customer Information */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <User className="h-4 w-4 text-green-400" />
                                        <span className="text-green-500 dark:text-green-300">Customer</span>
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-sm">Name:</span>
                                            <span className="text-foreground text-sm font-medium">
                                                {appointment.customer_type === 'walk_in' 
                                                    ? 'Walk-in Customer' 
                                                    : appointment.customer?.customer_name || 'Unknown Customer'}
                                            </span>
                                        </div>
                                        {appointment.customer_type === 'registered' && appointment.customer?.customer_phone && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">Phone:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.customer.customer_phone}
                                                </span>
                                            </div>
                                        )}
                                        {appointment.customer_type === 'registered' && appointment.customer?.customer_email && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">Email:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.customer.customer_email}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator className="bg-border" />

                                {/* Vehicle Information */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Car className="h-4 w-4 text-amber-400" />
                                        <span className="text-amber-500 dark:text-amber-300">Vehicle</span>
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-sm">Vehicle:</span>
                                            <span className="text-foreground text-sm">
                                                {appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info
                                                    ? `${appointment.walk_in_vehicle_info.year} ${appointment.walk_in_vehicle_info.make} ${appointment.walk_in_vehicle_info.model}${appointment.walk_in_vehicle_info.license_plate ? ` (${appointment.walk_in_vehicle_info.license_plate})` : ''}`
                                                    : appointment.vehicle
                                                        ? `${appointment.vehicle.year || ''} ${appointment.vehicle.make || ''} ${appointment.vehicle.model || ''}`.trim() || 'Unknown Vehicle'
                                                        : 'Unknown Vehicle'}
                                            </span>
                                        </div>
                                        {(appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.color) || appointment.vehicle?.color ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">Color:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.color
                                                        ? appointment.walk_in_vehicle_info.color
                                                        : appointment.vehicle?.color}
                                                </span>
                                            </div>
                                        ) : null}
                                        {(appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.license_plate) || appointment.vehicle?.license_plate ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">License Plate:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.license_plate
                                                        ? appointment.walk_in_vehicle_info.license_plate
                                                        : appointment.vehicle?.license_plate}
                                                </span>
                                            </div>
                                        ) : null}
                                        {(appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.mileage) || appointment.vehicle?.mileage ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground text-sm">Mileage:</span>
                                                <span className="text-foreground text-sm">
                                                    {appointment.customer_type === 'walk_in' && appointment.walk_in_vehicle_info?.mileage
                                                        ? appointment.walk_in_vehicle_info.mileage.toLocaleString()
                                                        : appointment.vehicle?.mileage?.toLocaleString()} miles
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                {/* Notes */}
                                {appointment.notes && (
                                    <>
                                        <Separator className="bg-border" />
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Notes
                                            </h4>
                                            <div className="text-sm text-foreground bg-white dark:bg-card border border-border rounded-lg p-3">
                                                {appointment.notes}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Work Order Link */}
                                {appointment.work_order && (
                                    <>
                                        <Separator className="bg-border" />
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                Work Order
                                            </h4>
                                            <div className="flex items-center justify-between bg-white dark:bg-card border border-border rounded-lg p-3">
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">
                                                        {appointment.work_order.work_order_number}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Status: {appointment.work_order.status}
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={handleViewWorkOrder}
                                                    className="text-blue-400 hover:text-blue-300 hover:bg-accent"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator className="bg-border" />

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    {/* Message button - only show for registered customers with phone */}
                                    {appointment.customer_type === 'registered' && appointment.customer?.customer_phone && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleShowMessageModal}
                                            className="w-full bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit?.(appointment)}
                                        disabled={!canEdit}
                                        className="w-full bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>

                                    {canCreateWorkOrder ? (
                                        <Button
                                            size="sm"
                                            onClick={() => onCreateWorkOrder?.(appointment.id)}
                                            disabled={isCreatingWorkOrder}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isCreatingWorkOrder ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Creating Work Order...
                                                </>
                                            ) : (
                                                <>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Create Work Order
                                                </>
                                            )}
                                        </Button>
                                    ) : hasWorkOrder && (
                                        <Button
                                            size="sm"
                                            onClick={handleViewWorkOrder}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            View Work Order
                                        </Button>
                                    )}

                                    {canCancel && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onCancel?.(appointment.id)}
                                            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Cancel Appointment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Message Modal */}
            <AppointmentMessageModal
                appointment={appointment}
                isOpen={showMessageModal}
                onClose={handleCloseMessageModal}
                onConfirm={handleMessageConfirm}
                messageType="custom"
            />
        </>
    )
}

