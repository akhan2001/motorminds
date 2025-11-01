'use client'

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Package, Phone } from 'lucide-react'
import SupplierCallForm from './CallForm/Supplier-CallForm'
import VehicleCallForm from './CallForm/Vehicle-CallForm'
import PartsCallForm from './CallForm/Parts-CallForm'
import AdditionalCallForm from './CallForm/Additional-CallForm'
import { toast } from 'sonner'
import { 
    VehicleInfo, 
    PartItem, 
    SelectedSupplier, 
    PartsRequestPriority 
} from '../types'
import { PartsRequestService } from '../services/partsRequestService'
import { VoiceCallService } from '../lib/voiceCallService'
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { VoiceCallPurpose } from '../types/voice-call'
import { sendPartsRequestEmail } from '@/lib/parts-request/parts-request-email-service'


interface CallFormProps {
    trigger?: React.ReactNode
    onCallComplete?: (callId: string, partsRequestId: string) => void
    prefillData?: {
        phone?: string
        supplier?: string
    }
}

export interface CallFormRef {
    openForm: () => void
}

const CallForm = forwardRef<CallFormRef, CallFormProps>(({ 
    trigger, 
    onCallComplete,
    prefillData 
}, ref) => {
    const [open, setOpen] = useState(false)
    const [selectedSuppliers, setSelectedSuppliers] = useState<SelectedSupplier[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCalling, setIsCalling] = useState(false)
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'completed' | 'failed'>('idle')
    const [callId, setCallId] = useState<string | null>(null)
    const [partsRequestId, setPartsRequestId] = useState<string | null>(null)
    const [quoteData, setQuoteData] = useState<any>(null)
    const [isPolling, setIsPolling] = useState(false)

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        openForm: () => setOpen(true)
    }))

    const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
        year: '',
        make: '',
        model: '',
        vin: '',
        mileage: '',
        engine: '',
        trim: '',
        color: '',
        transmission: '',
        drivetrain: '',
        fuel_type: '',
        body_style: ''
    })

    const [partInfo, setPartInfo] = useState<PartItem>({
        partName: '',
        partNumber: '',
        quantity: 1,
        description: ''
    })

    const [priority, setPriority] = useState<PartsRequestPriority>('normal')
    const [notes, setNotes] = useState('')
    const [callPurpose, setCallPurpose] = useState<VoiceCallPurpose>('parts_ordering')
    // Cleanup polling on component unmount
    useEffect(() => {
        return () => {
            if (isPolling) {
                setIsPolling(false)
            }
        }
    }, [isPolling])

    // Handle prefill data
    useEffect(() => {
        if (prefillData?.phone && prefillData?.supplier) {
            // Find and select the supplier if provided
            // This would need to be implemented based on your supplier data structure
        }
    }, [prefillData])

    const handleSuppliersChange = (suppliers: SelectedSupplier[]) => {
        setSelectedSuppliers(suppliers)
    }

    const handleVehicleChange = (field: keyof VehicleInfo, value: string) => {
        setVehicleInfo(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handlePartChange = (field: keyof PartItem, value: string | number) => {
        setPartInfo((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const resetForm = () => {
        setSelectedSuppliers([])
        setVehicleInfo({ 
            year: '', make: '', model: '', vin: '', mileage: '', engine: '',
            trim: '', color: '', transmission: '', drivetrain: '', fuel_type: '', body_style: ''
        })
        setPartInfo({ partName: '', partNumber: '', quantity: 1, description: '' })
        setPriority('normal')
        setNotes('')
        setCallStatus('idle')
        setCallId(null)
        setPartsRequestId(null)
        setQuoteData(null)
    }

    const handleClose = () => {
        resetForm()
        setOpen(false)
    }

    const handleSubmit = async () => {
        // Validation
        if (selectedSuppliers.length === 0) {
            toast.error('Please select at least one supplier')
            return
        }

        if (!vehicleInfo.year || !vehicleInfo.make || !vehicleInfo.model) {
            toast.error('Please provide vehicle year, make, and model')
            return
        }

        if (!partInfo.partName && !partInfo.description) {
            toast.error('Please provide a part name or description')
            return
        }

        try {
            setIsSubmitting(true)
            toast.info('Creating parts request...')
            
            // Get shop ID from authenticated user
            const supabase = createClient()
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            // Get user's shop ID
            const { data: userData, error: shopError } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single()

            if (shopError || !userData?.shop_id) {
                throw new Error('Shop ID not found for user')
            }

            const shopId = userData.shop_id

            // Convert form data to parts request format
            const partsRequested = [{
                part_name: partInfo.partName,
                part_number: partInfo.partNumber || undefined,
                quantity: partInfo.quantity || 1,
                estimated_price: 0,
                description: partInfo.description || '',
                supplier_part_number: '',
                brand: '',
                availability: 'unknown'
            }]

            // Create supplier info with multi-supplier support
            const supplierInfo = {
                supplier_name: selectedSuppliers[0]?.name || 'Unknown Supplier',
                supplier_id: selectedSuppliers[0]?.id || undefined,
                contact_person: selectedSuppliers[0]?.contact_person || '',
                phone_number: selectedSuppliers[0]?.phone_number || '',
                email: selectedSuppliers[0]?.email || '',
                account_number: selectedSuppliers[0]?.account_number || '',
                // Multi-supplier metadata
                selected_suppliers: selectedSuppliers,
                total_suppliers: selectedSuppliers.length,
                completed_suppliers: 0,
                failed_suppliers: 0
            }

            // Create vehicle info
            const vehicleData: VehicleInfo = {
                year: vehicleInfo.year ? (typeof vehicleInfo.year === 'string' ? parseInt(vehicleInfo.year) : vehicleInfo.year) : '',
                make: vehicleInfo.make,
                model: vehicleInfo.model,
                vin: vehicleInfo.vin || '',
                engine: vehicleInfo.engine || '',
                mileage: vehicleInfo.mileage ? (typeof vehicleInfo.mileage === 'string' ? parseInt(vehicleInfo.mileage.replace(/,/g, '')) : vehicleInfo.mileage) : '',
                trim: vehicleInfo.trim || '',
                color: vehicleInfo.color || '',
                transmission: vehicleInfo.transmission || '',
                drivetrain: vehicleInfo.drivetrain || '',
                fuel_type: vehicleInfo.fuel_type || '',
                body_style: vehicleInfo.body_style || ''
            }

            // Create parts request using PartsRequestService
            const newPartsRequest = await PartsRequestService.createPartsRequest({
                vehicleInfo: vehicleData,
                partsRequested: partsRequested,
                selectedSuppliers: selectedSuppliers,
                priority: priority,
                notes: notes.trim() || '',
                shopId: shopId,
                userId: user.id
            })

            // Send email notification following feedback pattern
            try {
                // Convert vehicleData for email service (year should be string)
                const emailVehicleInfo = {
                    year: vehicleData.year ? String(vehicleData.year) : undefined,
                    make: vehicleData.make,
                    model: vehicleData.model,
                    engine: vehicleData.engine || undefined
                }

                // Convert partsRequested for email service
                const emailPartsRequested = partsRequested.map(part => ({
                    part_name: part.part_name,
                    part_number: part.part_number || undefined,
                    quantity: part.quantity,
                    estimated_price: part.estimated_price,
                    description: part.description || undefined
                }))

                const emailResult = await sendPartsRequestEmail({
                    partsRequestId: newPartsRequest.id,
                    shopId: shopId,
                    vehicleInfo: emailVehicleInfo,
                    partsRequested: emailPartsRequested,
                    notes: notes.trim() || undefined,
                    totalEstimatedPrice: 0, // Parts request doesn't have estimated price from form
                    priority: priority
                })

                if (!emailResult.success) {
                    console.error('Failed to send parts request email:', emailResult.error)
                    // Don't fail the submission if email fails
                } else {
                    console.log('Parts request email sent successfully')
                }
            } catch (emailError) {
                console.error('Email notification error:', emailError)
                // Don't fail the submission if email fails
            }

            toast.success('Parts request created successfully!')
            setPartsRequestId(newPartsRequest.id)
            
            // Notify parent to refresh the list
            if (onCallComplete) {
                onCallComplete('', newPartsRequest.id)
            }
            
            // Close the form
            handleClose()
            
        } catch (error) {
            console.error('Error creating parts request:', error)
            toast.error(`Failed to create parts request: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Start AI call after parts request is created
    const startAICall = async (partsRequestId: string, shopId: string) => {
        try {
            setIsCalling(true)
            setCallStatus('calling')
            setIsPolling(true)
            
            // Use multi-supplier call if multiple suppliers selected
            if (selectedSuppliers.length > 1) {
                const result = await VoiceCallService.startMultiSupplierCalls({
                    partsRequestId,
                    suppliers: selectedSuppliers.map(s => ({
                        id: s.id,
                        name: s.name,
                        phone_number: s.phone_number || '',
                        contact_person: s.contact_person
                    })),
                    purpose: callPurpose,
                    vehicleInfo,
                    partsInfo: [partInfo],
                    priority,
                    notes,
                    shopId
                })

                // Find first successful call to monitor
                const firstSuccessful = result.results.find((r: any) => r.success)
                if (firstSuccessful && firstSuccessful.callId) {
                    setCallId(firstSuccessful.callId)
                    listenForCallCompletion(firstSuccessful.callId)
                }
                
                setCallStatus('completed')
                setIsPolling(false)
                
                // Notify parent after delay to allow webhook processing
                setTimeout(() => {
                    if (onCallComplete) {
                        onCallComplete('', partsRequestId)
                    }
                }, 2000)
                
            } else {
                // Single supplier call
                const result = await VoiceCallService.startCall({
                    partsRequestId,
                    supplierId: selectedSuppliers[0].id,
                    phoneNumber: selectedSuppliers[0].phone_number || '',
                    purpose: callPurpose,
                    vehicleInfo,
                    partsInfo: [partInfo],
                    priority,
                    notes,
                    shopId
                })

                if (result.success) {
                    setCallId(result.callId)
                    listenForCallCompletion(result.callId)
                } else {
                    throw new Error('Failed to start call via VoiceCallService')
                }
            }

        } catch (error: any) {
            console.error('Error starting AI call:', error)
            toast.error(error.message || 'Failed to start AI call')
            setCallStatus('failed')
            setIsPolling(false)
        } finally {
            setIsCalling(false)
        }
    }

    // Listen for real-time call completion via Server-Sent Events
    const listenForCallCompletion = async (callId: string) => {
        try {
            // Set up Server-Sent Events connection
            const eventSource = new EventSource(`/api/voice-calling/events?call_id=${callId}`)
            
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    console.log('📡 Real-time call update:', data)
                    
                    if (data.status === 'completed') {
                        setCallStatus('completed')
                        setQuoteData(data.quote_data)
                        setIsPolling(false)
                        eventSource.close()
                        
                        // Show success message
                        toast.success('Call completed! Quote received.')
                        
                        // Notify parent component
                        if (onCallComplete) {
                            onCallComplete(callId, partsRequestId!)
                        }
                        
                    } else if (data.status === 'failed') {
                        setCallStatus('failed')
                        setIsPolling(false)
                        eventSource.close()
                        toast.error('Call failed. Please try again.')
                    }
                } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError)
                }
            }
            
            eventSource.onerror = (error) => {
                console.error('SSE connection error:', error)
                eventSource.close()
                
                // Fallback to minimal polling as backup
                fallbackPolling(callId)
            }
            
            // Cleanup connection after 10 minutes
            setTimeout(() => {
                if (eventSource.readyState !== EventSource.CLOSED) {
                    eventSource.close()
                    setIsPolling(false)
                    setCallStatus('failed')
                    toast.error('Call timeout. Please try again.')
                }
            }, 300000) // 5 minutes
            
        } catch (error) {
            console.error('Error setting up real-time connection:', error)
            // Fallback to polling if SSE fails
            fallbackPolling(callId)
        }
    }

    // Fallback polling method (minimal, only as backup)
    const fallbackPolling = (callId: string) => {
        console.log('📊 Using fallback polling for call:', callId)
        
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/voice-calling/status?call_id=${callId}`)
                const data = await response.json()
                
                if (data.status === 'completed' || data.status === 'failed') {
                    setCallStatus(data.status)
                    if (data.status === 'completed') {
                        setQuoteData(data.quote_data)
                        toast.success('Call completed! Quote received.')
                        
                        // Notify parent component
                        if (onCallComplete) {
                            onCallComplete(callId, partsRequestId!)
                        }
                    } else {
                        toast.error('Call failed. Please try again.')
                    }
                    setIsPolling(false)
                    clearInterval(pollInterval)
                }
            } catch (error) {
                console.error('Fallback polling error:', error)
            }
        }, 5000) // Poll every 5 seconds (less frequent as backup)
        
        // Stop fallback polling after 10 minutes
        setTimeout(() => {
            if (isPolling) {
                clearInterval(pollInterval)
                setIsPolling(false)
                setCallStatus('failed')
                toast.error('Call timeout. Please try again.')
            }
        }, 300000)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Phone className="h-4 w-4 mr-2" />
                        Make New Call
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-popover dark:bg-[#0d0d0d] border-border dark:border-[#2a2a2a]">
                <DialogHeader>
                    <DialogTitle className="text-foreground dark:text-white text-xl">
                        AI Parts Ordering
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-gray-400 text-sm">
                        Fill our the form below to create a parts request and have Mia AI to call the suppliers.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Call Status Display */}
                    {callStatus === 'calling' && (
                        <Card className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <CardContent className="p-4">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-3"></div>
                                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                                        Calling {selectedSuppliers[0]?.name}... Please wait.
                                    </span>
                                </div>
                                <p className="text-blue-600 dark:text-blue-300 text-sm mt-2">
                                    Mia AI is speaking with the supplier to get your quote.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {callStatus === 'completed' && quoteData && (
                        <Card className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Quote Received!
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {quoteData.parts_info && quoteData.parts_info.length > 0 ? (
                                    <div className="space-y-3">
                                        {quoteData.parts_info.map((part: any, index: number) => (
                                            <div key={index} className="bg-white dark:bg-[#1a1a1a] p-3 rounded-lg border border-border dark:border-[#2a2a2a]">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-semibold text-foreground dark:text-white">{part.part_name}</h4>
                                                        {part.part_number && (
                                                            <p className="text-sm text-muted-foreground dark:text-gray-400">Part #: {part.part_number}</p>
                                                        )}
                                                        <p className="text-sm text-muted-foreground dark:text-gray-400">Qty: {part.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                            ${part.unit_price?.toFixed(2) || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {quoteData.quote_details && (
                                            <div className="bg-slate-50 dark:bg-[#0d0d0d] p-3 rounded-lg border-t-2 border-green-500 dark:border-green-600">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-semibold text-foreground dark:text-white">Total:</span>
                                                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        ${quoteData.quote_details.total_cost?.toFixed(2) || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-3 pt-3">
                                            <Button 
                                                onClick={handleClose}
                                                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                            >
                                                <Package className="h-4 w-4 mr-2" />
                                                Close & View Quote
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-green-700 dark:text-green-300">Call completed, but no quote details available.</p>
                                        <Button 
                                            variant="outline"
                                            onClick={handleClose}
                                            className="mt-3"
                                        >
                                            Close
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {callStatus === 'failed' && (
                        <Card className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                            <CardContent className="p-4">
                                <div className="text-red-800 dark:text-red-200">
                                    <p className="font-medium">Call failed</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">Please check the phone number and try again.</p>
                                    <Button 
                                        variant="outline"
                                        onClick={() => setCallStatus('idle')}
                                        className="mt-3 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* <div>
                        <h3 className="text-lg font-medium text-foreground dark:text-white">Call Purpose</h3>
                        <Select
                            value={callPurpose}
                            onValueChange={(value) => setCallPurpose(value as VoiceCallPurpose)}
                        >
                            <SelectTrigger className="bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-popover-foreground dark:text-white">
                            <SelectItem className="hover:bg-accent dark:hover:bg-[#2a2a2a]" value="quote_request">Quote Request</SelectItem>
                                <SelectItem className="hover:bg-accent dark:hover:bg-[#2a2a2a]" value="parts_ordering">Parts Ordering</SelectItem>
                                <SelectItem className="hover:bg-accent dark:hover:bg-[#2a2a2a]" value="general_inquiry">General Inquiry</SelectItem>
                                <SelectItem className="hover:bg-accent dark:hover:bg-[#2a2a2a]" value="order_followup">Order Follow-up</SelectItem>
                            </SelectContent>
                        </Select>
                    </div> */}

                    {/* Supplier Information */}
                    <SupplierCallForm
                        selectedSuppliers={selectedSuppliers}
                        onSuppliersChange={handleSuppliersChange}
                    />

                    {/* Vehicle Information */}
                    <VehicleCallForm
                        vehicleInfo={vehicleInfo}
                        onVehicleChange={handleVehicleChange}
                    />

                    {/* Parts Information */}
                    <PartsCallForm
                        partInfo={partInfo}
                        onPartChange={handlePartChange}
                    />

                    {/* Additional Options */}
                    <AdditionalCallForm
                        priority={priority}
                        onPriorityChange={setPriority}
                        notes={notes}
                        onNotesChange={setNotes}
                    />

                    {/* Submit Button */}
                    <div className="flex justify-center gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || isCalling || selectedSuppliers.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                        >
                            <Phone className="h-5 w-5 mr-2" />
                            {isSubmitting ? 'Creating Request...' : isCalling ? 'Mia is calling...' : 'Create Parts Request'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="border-border dark:border-gray-600 text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
})

CallForm.displayName = 'CallForm'

export default CallForm
