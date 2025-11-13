import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Car, User, Phone, MessageSquare, Lock, Loader2, Sparkles, Zap } from 'lucide-react'
import { formatPhoneNumber } from '@/lib/utils/text'
import { useWorkOrderMessaging } from '../../../hooks/use-work-order-messaging'
import { MESSAGE_TEMPLATES, formatMessage } from '../Messages/MessagePrompts'
import { replaceVariables } from '@/app/(features)/messaging/lib/variable-replacer'
import type { WorkOrderCompletionModalProps } from '../../../types/work-order-messaging'

type MessageMode = 'automated' | 'manual' | 'skip'

interface AutomatedTemplate {
    id: string
    name: string
    message_template: string
    delay_hours: number
}

export const WorkOrderCompletionModal: React.FC<WorkOrderCompletionModalProps> = ({
    workOrder,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [messageMode, setMessageMode] = useState<MessageMode>('automated')
    const [automatedTemplates, setAutomatedTemplates] = useState<AutomatedTemplate[]>([])
    const [selectedAutomatedTemplate, setSelectedAutomatedTemplate] = useState<string>('')
    const [customMessage, setCustomMessage] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('ready_for_pickup')
    const [isEditing, setIsEditing] = useState(false)
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
    const { sendCompletionMessage, isLoading, messagingAvailability } = useWorkOrderMessaging()

    // Check for automated templates when modal opens
    useEffect(() => {
        if (workOrder && isOpen) {
            checkAutomatedTemplates()
        }
    }, [workOrder, isOpen])

    // Update message preview when mode or template changes
    useEffect(() => {
        if (workOrder && isOpen) {
            if (messageMode === 'automated' && selectedAutomatedTemplate) {
                const template = automatedTemplates.find(t => t.id === selectedAutomatedTemplate)
                if (template) {
                    const preview = generateAutomatedPreview(template.message_template)
                    setCustomMessage(preview)
                }
            } else if (messageMode === 'manual') {
                const customerName = workOrder.customer?.customer_name || 'Customer'
                const vehicleInfo = workOrder.vehicle ? 
                    `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
                    undefined
                const serviceDescription = workOrder.title

                const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.template || MESSAGE_TEMPLATES[0].template
                const formattedMessage = formatMessage(
                    template,
                    customerName,
                    vehicleInfo,
                    serviceDescription
                )
                setCustomMessage(formattedMessage)
            }
        }
    }, [workOrder, isOpen, messageMode, selectedAutomatedTemplate, selectedTemplate, automatedTemplates])

    const checkAutomatedTemplates = async () => {
        setIsLoadingTemplates(true)
        try {
            const response = await fetch('/api/messaging/ai/templates/check?trigger_type=work_order_completed')
            const data = await response.json()
            
            if (data.hasAutomatedTemplates && data.templates.length > 0) {
                setAutomatedTemplates(data.templates)
                setSelectedAutomatedTemplate(data.templates[0].id)
                setMessageMode('automated')
            } else {
                setMessageMode('manual')
            }
        } catch (error) {
            console.error('Error checking automated templates:', error)
            setMessageMode('manual')
        } finally {
            setIsLoadingTemplates(false)
        }
    }

    const generateAutomatedPreview = (template: string): string => {
        if (!workOrder) return template

        const customer = Array.isArray(workOrder.customer) ? workOrder.customer[0] : workOrder.customer
        const vehicle = Array.isArray(workOrder.vehicle) ? workOrder.vehicle[0] : workOrder.vehicle

        const sampleData = {
            customer: {
                customer_name: customer?.customer_name || 'Customer',
                customer_phone: customer?.customer_phone || '',
                customer_email: customer?.customer_email || ''
            },
            vehicle: {
                year: vehicle?.year || '',
                make: vehicle?.make || '',
                model: vehicle?.model || '',
                license_plate: vehicle?.license_plate || ''
            },
            work_order: {
                work_order_number: workOrder.id.slice(0, 8).toUpperCase(),
                title: workOrder.title || 'Service',
                status: 'completed',
                total_amount: 0 // Would need to calculate from items
            },
            shop: {
                shop_name: 'Your Shop',
                shop_phone: '',
                shop_address: ''
            }
        }

        return replaceVariables(template, sampleData, {
            missingVariableBehavior: 'placeholder'
        })
    }

    const handleSendMessage = async () => {
        if (!workOrder.customer?.customer_phone) {
            onConfirm(false, undefined, messageMode === 'automated')
            return
        }

        // If automated mode, don't send manual message - let automated system handle it
        if (messageMode === 'automated') {
            onConfirm(true, undefined, true) // true = skip automated trigger (already handled)
            return
        }

        // Manual mode - send message now
        await sendCompletionMessage({
            to: workOrder.customer.customer_phone,
            body: customMessage,
            customerName: workOrder.customer.customer_name
        })

        onConfirm(true, customMessage, true) // true = skip automated trigger (manual sent)
    }

    const handleSkipMessage = () => {
        onConfirm(false, undefined, false) // false = allow automated trigger
    }

    const vehicleInfo = workOrder.vehicle ? 
        `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}` : 
        'Vehicle information not available'

    const customerHasPhone = workOrder.customer?.customer_phone
    const hasAutomatedTemplates = automatedTemplates.length > 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-xl font-semibold text-foreground dark:text-white flex items-center gap-2">
                        <Car className="h-5 w-5 text-green-500" />
                        Work Order Completed
                    </DialogTitle>
                    <DialogDescription className="text-md text-muted-foreground dark:text-gray-400">
                        Complete the work order and choose how to notify the customer.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 overflow-y-auto flex-1 min-h-0 pr-1">
                    {/* Work Order Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground dark:text-gray-300">Work Order Summary</h3>
                        <div className="bg-card dark:bg-[#1a1a1a] rounded-lg p-4 border border-border dark:border-[#2a2a2a]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-semibold text-foreground dark:text-white">{workOrder.title}</span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/20">
                                    Completed
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
                                Customer Notification
                            </h3>
                            {(messagingAvailability.isLoading || isLoadingTemplates) && (
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
                            <div className="space-y-4">
                                {/* Message Mode Selection */}
                                <RadioGroup value={messageMode} onValueChange={(value) => setMessageMode(value as MessageMode)}>
                                    {hasAutomatedTemplates && (
                                        <div className="flex items-start space-x-2 space-y-0 p-3 rounded-lg border border-border dark:border-[#2a2a2a] bg-blue-500/5 dark:bg-blue-500/5">
                                            <RadioGroupItem value="automated" id="automated" className="mt-1" />
                                            <div className="flex-1 space-y-1">
                                                <Label htmlFor="automated" className="flex items-center gap-2 cursor-pointer">
                                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium text-foreground dark:text-white">Use Automated Template</span>
                                                    <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                        Recommended
                                                    </Badge>
                                                </Label>
                                                <p className="text-xs text-muted-foreground dark:text-gray-400 ml-6">
                                                    Automatically send a pre-configured message. No manual work needed.
                                                </p>
                                                {messageMode === 'automated' && automatedTemplates.length > 0 && (
                                                    <div className="mt-2 ml-6">
                                                        <Select value={selectedAutomatedTemplate} onValueChange={setSelectedAutomatedTemplate}>
                                                            <SelectTrigger className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
                                                                {automatedTemplates.map((template) => (
                                                                    <SelectItem key={template.id} value={template.id} className="text-foreground dark:text-white">
                                                                        {template.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start space-x-2 space-y-0 p-3 rounded-lg border border-border dark:border-[#2a2a2a]">
                                        <RadioGroupItem value="manual" id="manual" className="mt-1" />
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                                                <Zap className="h-4 w-4 text-yellow-500" />
                                                <span className="font-medium text-foreground dark:text-white">Send Custom Message</span>
                                            </Label>
                                            <p className="text-xs text-muted-foreground dark:text-gray-400 ml-6">
                                                Choose a template or write a custom message to send immediately.
                                            </p>
                                            {messageMode === 'manual' && (
                                                <div className="mt-3 ml-6 space-y-3">
                                                    <div className="space-y-2">
                                                        <span className="text-sm text-foreground dark:text-gray-300">Choose a message template:</span>
                                                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                                            <SelectTrigger className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                                                <SelectValue placeholder="Select a message template" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-popover dark:bg-[#111111] border-border dark:border-[#2a2a2a]">
                                                                {MESSAGE_TEMPLATES.map((template) => (
                                                                    <SelectItem 
                                                                        key={template.id} 
                                                                        value={template.id}
                                                                        className="text-foreground dark:text-white hover:bg-accent dark:hover:bg-[#1a1a1a]"
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
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-2 space-y-0 p-3 rounded-lg border border-border dark:border-[#2a2a2a]">
                                        <RadioGroupItem value="skip" id="skip" className="mt-1" />
                                        <div className="flex-1 space-y-1">
                                            <Label htmlFor="skip" className="cursor-pointer">
                                                <span className="font-medium text-foreground dark:text-white">Skip Message</span>
                                            </Label>
                                            <p className="text-xs text-muted-foreground dark:text-gray-400 ml-6">
                                                Complete the work order without sending a message.
                                            </p>
                                        </div>
                                    </div>
                                </RadioGroup>

                                {/* Message Preview */}
                                {(messageMode === 'automated' || messageMode === 'manual') && (
                                    <div className="bg-card dark:bg-[#1a1a1a] rounded-lg border border-border dark:border-[#2a2a2a]">
                                        <div className="p-3 border-b border-border dark:border-[#2a2a2a]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-foreground dark:text-gray-300">Message Preview:</span>
                                                {messageMode === 'manual' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsEditing(!isEditing)}
                                                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                                                    >
                                                        {isEditing ? 'Done' : 'Edit'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            {messageMode === 'manual' && isEditing ? (
                                                <Textarea
                                                    value={customMessage}
                                                    onChange={(e) => setCustomMessage(e.target.value)}
                                                    className="bg-background dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white resize-none"
                                                    rows={4}
                                                    placeholder="Enter your completion message..."
                                                />
                                            ) : (
                                                <p className="text-foreground dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                    {customMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                        Complete Without Message
                    </Button>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={
                                            !customerHasPhone || 
                                            !messagingAvailability.isAvailable || 
                                            isLoading ||
                                            (messageMode === 'automated' && !selectedAutomatedTemplate) ||
                                            (messageMode === 'manual' && !customMessage.trim())
                                        }
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
                                                {messageMode === 'automated' ? 'Complete & Send Automatically' : 'Send Message & Complete'}
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

