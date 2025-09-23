import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, User, Phone, MessageSquare, Lock, Loader2, Car, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { formatPhoneNumber } from '@/lib/utils/text'
import { useAppointmentMessaging } from '../../hooks/appointments/useAppointmentMessaging'
import { 
    formatAppointmentMessage, 
    getDefaultMessageByType,
    APPOINTMENT_MESSAGE_TEMPLATES 
} from './Messages/AppointmentMessagePrompts'
import type { AppointmentMessageModalProps } from '../../types/appointment-messaging'

export const AppointmentMessageModal: React.FC<AppointmentMessageModalProps> = ({
    appointment,
    isOpen,
    onClose,
    onConfirm,
    messageType = 'custom'
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(messageType)
    const [isEditing, setIsEditing] = useState(false)
    const { sendAppointmentMessage, isLoading, messagingAvailability } = useAppointmentMessaging()

    // Format the default message with actual appointment data
    useEffect(() => {
        if (appointment && isOpen) {
            const customerName = appointment.customer?.customer_name || 'Customer'
            const vehicleInfo = appointment.vehicle ? 
                `${appointment.vehicle.year} ${appointment.vehicle.make} ${appointment.vehicle.model}` : 
                undefined
            const serviceType = appointment.service_type
            const appointmentDate = format(new Date(appointment.appointment_date), 'EEEE, MMMM d')
            const appointmentTime = appointment.start_time || 'your scheduled time'

            const defaultTemplate = getDefaultMessageByType(selectedTemplate as any)
            const formattedMessage = formatAppointmentMessage(
                defaultTemplate,
                customerName,
                appointmentDate,
                appointmentTime,
                serviceType,
                vehicleInfo
            )

            setCustomMessage(formattedMessage)
        }
    }, [appointment, isOpen, selectedTemplate])

    const handleSendMessage = async () => {
        if (!appointment.customer?.customer_phone) {
            onConfirm(false)
            return
        }

        await sendAppointmentMessage({
            to: appointment.customer.customer_phone,
            body: customMessage,
            customerName: appointment.customer.customer_name
        })

        onConfirm(true, customMessage)
    }

    const handleCancel = () => {
        onConfirm(false)
    }

    const handleTemplateChange = (templateType: string) => {
        setSelectedTemplate(templateType as any)
    }

    const vehicleInfo = appointment.vehicle ? 
        `${appointment.vehicle.year} ${appointment.vehicle.make} ${appointment.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasPhone = appointment.customer?.customer_phone
    const appointmentDate = format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')
    const appointmentTime = appointment.start_time || 'Not specified'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        Send Appointment Message
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Appointment Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Appointment Details</h3>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-white">{appointment.service_type}</span>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    {appointment.status || 'Scheduled'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {appointmentDate}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {appointmentTime}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                <p className="text-white font-medium">{appointment.customer?.customer_name || 'Unknown'}</p>
                                {appointment.customer?.customer_phone && (
                                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(appointment.customer.customer_phone)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
                                <p className="text-white font-medium">{vehicleInfo}</p>
                                {appointment.vehicle?.license_plate && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        License: {appointment.vehicle.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* Message Template Selection */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Message Template</h3>
                        <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                <SelectValue placeholder="Choose a message template" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                                {APPOINTMENT_MESSAGE_TEMPLATES.map((template) => (
                                    <SelectItem 
                                        key={template.id} 
                                        value={template.type}
                                        className="text-white hover:bg-[#2a2a2a]"
                                    >
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Messaging Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Message Content
                            </h3>
                            {messagingAvailability.isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            )}
                        </div>

                        {!customerHasPhone ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-400 text-sm">
                                    No phone number available for this customer.
                                </p>
                            </div>
                        ) : !messagingAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-400" />
                                    <p className="text-red-400 text-sm">
                                        Messaging is not available. Contact admin to set up Twilio.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                                    <div className="p-3 border-b border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                {isEditing ? 'Done' : 'Edit'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        {isEditing ? (
                                            <Textarea
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                className="bg-[#0a0a0a] border-[#2a2a2a] text-white resize-none"
                                                rows={4}
                                                placeholder="Enter your message..."
                                            />
                                        ) : (
                                            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                {customMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                    >
                        Cancel
                    </Button>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!customerHasPhone || !messagingAvailability.isAvailable || isLoading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasPhone || !messagingAvailability.isAvailable) && (
                                <TooltipContent>
                                    <p>
                                        {!customerHasPhone 
                                            ? "Customer phone number required" 
                                            : "Contact admin to set up messaging"
                                        }
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
