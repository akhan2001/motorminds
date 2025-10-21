import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Car, User, Phone, MessageSquare, Lock, Loader2 } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils/text'
import { useWorkOrderMessaging } from '../../../hooks/use-work-order-messaging'
import { DEFAULT_COMPLETION_MESSAGE, formatMessage } from '../Messages/MessagePrompts'
import type { WorkOrderCompletionModalProps } from '../../../types/work-order-messaging'

export const WorkOrderCompletionModal: React.FC<WorkOrderCompletionModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [customMessage, setCustomMessage] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const { sendCompletionMessage, isLoading, messagingAvailability } = useWorkOrderMessaging()

    // Format the default message with actual work order data
    useEffect(() => {
        if (workOrder && isOpen) {
            const customerName = workOrder.customer?.customer_name || 'Customer'
            const vehicleInfo = workOrder.vehicle ? 
                `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
                undefined
            const serviceDescription = workOrder.title

            const formattedMessage = formatMessage(
                DEFAULT_COMPLETION_MESSAGE,
                customerName,
                vehicleInfo,
                serviceDescription
            )

            setCustomMessage(formattedMessage)
        }
    }, [workOrder, isOpen])

    const handleSendMessage = async () => {
        if (!workOrder.customer?.customer_phone) {
            onConfirm(false)
            return
        }

        await sendCompletionMessage({
            to: workOrder.customer.customer_phone,
            body: customMessage,
            customerName: workOrder.customer.customer_name
        })

        onConfirm(true, customMessage)
    }

    const handleSkipMessage = () => {
        onConfirm(false)
    }

    const vehicleInfo = workOrder.vehicle ? 
        `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasPhone = workOrder.customer?.customer_phone

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <Car className="h-5 w-5 text-green-500" />
                        Work Order Completed
                    </DialogTitle>
                    <DialogDescription className="text-md text-gray-400">
                        Complete the work order and send a completion message to the customer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Work Order Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-300">Work Order Summary</h3>
                        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-white">{workOrder.title}</span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    Completed
                                </Badge>
                            </div>
                            {workOrder.description && (
                                <p className="text-sm text-gray-400">{workOrder.description}</p>
                            )}
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
                                <p className="text-white font-medium">{workOrder.customer?.customer_name || 'Unknown'}</p>
                                {workOrder.customer?.customer_phone && (
                                    <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                                        <Phone className="h-3 w-3" />
                                        {formatPhoneNumber(workOrder.customer.customer_phone)}
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
                                {workOrder.vehicle?.license_plate && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        License: {workOrder.vehicle.license_plate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-[#2a2a2a]" />

                    {/* Messaging Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Send Completion Message
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
                                                rows={3}
                                                placeholder="Enter your completion message..."
                                            />
                                        ) : (
                                            <p className="text-white text-sm leading-relaxed">
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
                        onClick={handleSkipMessage}
                        disabled={isLoading}
                        className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                    >
                        Complete Without Message
                    </Button>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!customerHasPhone || !messagingAvailability.isAvailable || isLoading}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <MessageSquare className="h-4 w-4 mr-2" />
                                                Send Message & Complete
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
