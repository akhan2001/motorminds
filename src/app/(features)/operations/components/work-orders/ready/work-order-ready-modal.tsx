import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, User, Phone, MessageSquare, Lock, Loader2 } from 'lucide-react'
import { formatPhoneNumber } from '@/utils/format-phone'
import { useWorkOrderMessaging } from '../../../hooks/use-work-order-messaging'
import { MESSAGE_TEMPLATES, formatMessage } from '../Messages/MessagePrompts'
import type { WorkOrderWithDetails } from '../../../types/work-order'

interface WorkOrderReadyModalProps {
    workOrder: WorkOrderWithDetails
    isOpen: boolean
    onClose: () => void
    onConfirm: (sendMessage: boolean, customMessage?: string) => void
}

export const WorkOrderReadyModal: React.FC<WorkOrderReadyModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('ready_for_pickup')
    const [isEditing, setIsEditing] = useState(false)
    const { sendCompletionMessage, isLoading, messagingAvailability } = useWorkOrderMessaging()

    // Filter templates to only show "ready for pickup" templates
    const readyTemplates = MESSAGE_TEMPLATES.filter(t => 
        t.id.includes('ready_for_pickup')
    )

    // Format the selected template with actual work order data
    useEffect(() => {
        if (workOrder && isOpen) {
            const customerName = workOrder.customer?.customer_name || 'Customer'
            const vehicleInfo = workOrder.vehicle ? 
                `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
                undefined
            const serviceDescription = workOrder.title

            const template = readyTemplates.find(t => t.id === selectedTemplate)?.template || readyTemplates[0]?.template || ''
            const formattedMessage = formatMessage(
                template,
                customerName,
                vehicleInfo,
                serviceDescription
            )

            setCustomMessage(formattedMessage)
        }
    }, [workOrder, isOpen, selectedTemplate, readyTemplates])

    const handleSendMessage = async () => {
        if (!workOrder.customer?.customer_phone) {
            onConfirm(false, undefined)
            onClose()
            return
        }

        await sendCompletionMessage({
            to: workOrder.customer.customer_phone,
            body: customMessage,
            customerName: workOrder.customer.customer_name
        })

        onConfirm(true, customMessage)
        onClose()
    }

    const handleSkipMessage = async () => {
        onConfirm(false, undefined)
        onClose()
    }

    const vehicleInfo = workOrder.vehicle ? 
        `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasPhone = workOrder.customer?.customer_phone

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <Car className="h-5 w-5 text-purple-500" />
                        Vehicle Ready for Pickup
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        Notify the customer that their vehicle is ready for pickup.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
                    {/* Work Order Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground dark:text-gray-300">Work Order Summary</h3>
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-foreground dark:text-white">{workOrder.title}</span>
                                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20">
                                    Ready
                                </Badge>
                            </div>
                            {workOrder.description && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400">{workOrder.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Customer & Vehicle Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Customer
                            </h4>
                            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                <p className="text-foreground dark:text-white font-medium">{workOrder.customer?.customer_name || 'Unknown'}</p>
                                {workOrder.customer?.customer_phone && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(workOrder.customer.customer_phone)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                Vehicle
                            </h4>
                            <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-3 border border-border dark:border-[#2a2a2a]">
                                <p className="text-foreground dark:text-white font-medium">{vehicleInfo}</p>
                                {workOrder.vehicle?.license_plate && (
                                    <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                        License: {workOrder.vehicle.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border dark:bg-[#2a2a2a]" />

                    {/* Messaging Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Send Ready for Pickup Message
                            </h3>
                            {messagingAvailability.isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                            )}
                        </div>

                        {!customerHasPhone ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-500 dark:text-yellow-400 text-sm">
                                    No phone number available for this customer.
                                </p>
                            </div>
                        ) : !messagingAvailability.isAvailable ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-red-500 dark:text-red-400" />
                                    <p className="text-red-500 dark:text-red-400 text-sm">
                                        Messaging is not available. Contact admin to set up Twilio.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Template Selection */}
                                <div className="space-y-2">
                                    <span className="text-sm text-foreground dark:text-gray-300">Choose a message template:</span>
                                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                        <SelectTrigger className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                            <SelectValue placeholder="Select a message template" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
                                            {readyTemplates.map((template) => (
                                                <SelectItem 
                                                    key={template.id} 
                                                    value={template.id}
                                                    className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a] focus:bg-accent dark:focus:bg-[#1a1a1a]"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{template.name}</span>
                                                        <span className="text-xs text-muted-foreground dark:text-gray-400">
                                                            {template.description}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="bg-card dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                    <div className="p-3 border-b border-border dark:border-[#2a2a2a]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-foreground dark:text-gray-300">Message to send:</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
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
                                                className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                                rows={3}
                                                placeholder="Enter your ready for pickup message..."
                                            />
                                        ) : (
                                            <p className="text-foreground dark:text-white text-sm leading-relaxed">
                                                {customMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0 flex gap-3 pt-4 border-t border-border dark:border-[#2a2a2a]">
                    <Button
                        variant="outline"
                        onClick={handleSkipMessage}
                        disabled={isLoading}
                        className="border-border dark:border-[#2a2a2a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#1a1a1a] hover:text-foreground dark:hover:text-white"
                    >
                        Mark Ready Without Message
                    </Button>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!customerHasPhone || !messagingAvailability.isAvailable || isLoading}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Send Message & Mark Ready
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {(!customerHasPhone || !messagingAvailability.isAvailable) && (
                                <TooltipContent className="bg-popover text-popover-foreground border-border">
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
