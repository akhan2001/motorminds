'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Nav } from '@/app/components/nav'
import { Package, Car, Building, Send, Phone } from 'lucide-react'
import SupplierMultiSelect from '@/app/(features)/suppliers/components/supplier-multi-select'
import { toast } from 'sonner'
import { 
    VehicleInfo, 
    PartItem, 
    SelectedSupplier, 
    PartsRequestPriority 
} from '@/app/(features)/voice-calling/types'
import { formatPhoneNumberE164, isValidE164 } from '@/utils/format-phone'
import { PartsService } from '@/app/(features)/parts/lib/partsService'
import { createClient } from '@/utils/supabase/client'

export default function VoiceOrderingPage() {
    const [selectedSuppliers, setSelectedSuppliers] = useState<SelectedSupplier[]>([])
    const [isCalling, setIsCalling] = useState(false)
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'completed' | 'failed'>('idle')
    const [callId, setCallId] = useState<string | null>(null)
    const [partsRequestId, setPartsRequestId] = useState<string | null>(null)
    const [quoteData, setQuoteData] = useState<any>(null)
    const [isPolling, setIsPolling] = useState(false)

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

    // Cleanup polling on component unmount
    useEffect(() => {
        return () => {
            if (isPolling) {
                setIsPolling(false)
            }
        }
    }, [isPolling])


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
        setPartInfo((prev: PartItem) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleStartCall = async () => {

        // console.log("selectedSuppliers", selectedSuppliers)
        // console.log("vehicleInfo", vehicleInfo)
        // console.log("partInfo", partInfo)
        // console.log("notes", notes)

        
        // Validation
        if (selectedSuppliers.length === 0) {
            toast.error('Please select at least one supplier')
            return
        }

        if (!vehicleInfo.year?.trim() || !vehicleInfo.make?.trim() || !vehicleInfo.model?.trim()) {
            toast.error('Please provide vehicle year, make, and model')
            return
        }

        if (!partInfo.partName?.trim() || !partInfo.description?.trim()) {
            toast.error('Please provide a part name or description')
            return
        }

        // Format and validate phone number
        const formattedPhone = formatPhoneNumberE164(selectedSuppliers[0].phone_number || '')
        console.log('📱 Formatted phone:', formattedPhone)
        if (!isValidE164(formattedPhone)) {
            toast.error('Invalid phone number format. Must be a valid E.164 number')
            return
        }

        try {
            setIsCalling(true)
            setCallStatus('calling')
            setIsPolling(true)
            
            // Call API to handle the entire process
            const response = await fetch('/api/voice-calling/start-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vehicle_info: vehicleInfo,
                    parts_info: partInfo,
                    suppliers: selectedSuppliers,
                    priority,
                    notes
                })
            })

            if (!response.ok) {
                throw new Error('Failed to start call')
            }

            const result = await response.json()
            setCallId(result.callId)
            setPartsRequestId(result.parts_request_id)
            toast.success(`Mia AI is calling ${selectedSuppliers[0].name}...`)
            
            // Start listening for real-time call completion
            listenForCallCompletion(result.callId)

        } catch (error: any) {
            console.error('Error starting call:', error)
            toast.error(error.message || 'Failed to start call')
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
                        
                        // Reset form after successful call (delay for user to see quote)
                        setTimeout(() => {
                            if (callStatus !== 'completed') return // Don't reset if user is viewing quote
                            
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
                            toast.info('Form reset for next request')
                        }, 30000) // 30 seconds to review quote
                        
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
            }, 600000) // 10 minutes
            
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
        }, 600000)
    }

    // Handle place order
    const handlePlaceOrder = async () => {
        if (!quoteData || !partsRequestId) {
            toast.error('No quote data available')
            return
        }

        try {
            toast.info('Creating parts order...')
            
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

            // Convert quote data to parts request format
            const partsRequested = quoteData.parts_info?.map((part: any) => ({
                part_name: part.part_name || partInfo.partName,
                part_number: part.part_number || partInfo.partNumber || `QUOTE-${Date.now()}`,
                quantity: part.quantity || partInfo.quantity || 1,
                estimated_price: part.unit_price || 0,
                description: part.notes || partInfo.description || '',
                supplier_part_number: part.part_number || '',
                brand: part.brand || '',
                availability: part.availability || 'unknown'
            })) || [{
                part_name: partInfo.partName,
                part_number: partInfo.partNumber || `QUOTE-${Date.now()}`,
                quantity: partInfo.quantity || 1,
                estimated_price: quoteData.quote_details?.total_cost || 0,
                description: partInfo.description || '',
                supplier_part_number: '',
                brand: '',
                availability: 'unknown'
            }]

            // Create supplier info from selected supplier and quote data
            const supplierInfo = {
                supplier_name: selectedSuppliers[0]?.name || quoteData.supplier_info?.supplier_name || 'Unknown Supplier',
                supplier_id: selectedSuppliers[0]?.id || undefined,
                contact_person: selectedSuppliers[0]?.contact_person || quoteData.supplier_info?.contact_person || '',
                phone_number: selectedSuppliers[0]?.phone_number || quoteData.supplier_info?.phone_number || '',
                email: selectedSuppliers[0]?.email || quoteData.supplier_info?.email || '',
                account_number: selectedSuppliers[0]?.account_number || quoteData.supplier_info?.account_number || ''
            }

            // Create vehicle info
            const vehicleData = {
                year: vehicleInfo.year ? parseInt(vehicleInfo.year) : undefined,
                make: vehicleInfo.make,
                model: vehicleInfo.model,
                vin: vehicleInfo.vin || '',
                engine: vehicleInfo.engine || '',
                mileage: vehicleInfo.mileage ? parseInt(vehicleInfo.mileage.replace(/,/g, '')) : undefined,
                trim: vehicleInfo.trim || '',
                color: vehicleInfo.color || '',
                transmission: vehicleInfo.transmission || '',
                drivetrain: vehicleInfo.drivetrain || '',
                fuel_type: vehicleInfo.fuel_type || '',
                body_style: vehicleInfo.body_style || ''
            }

            // Create parts request using PartsService
            console.log('🔧 Creating parts request with data:', {
                shopId,
                supplier_info: supplierInfo,
                parts_requested: partsRequested,
                vehicle_info: vehicleData,
                priority,
                notes: `Created from AI call quote. Original parts request ID: ${partsRequestId}. ${notes}`.trim(),
                customer_notes: quoteData.call_outcome?.notes || ''
            })
            
            const newPartsRequest = await PartsService.createPartsRequest(
                shopId,
                {
                    vehicle_info: vehicleData,
                    parts_requested: partsRequested,
                    supplier_info: supplierInfo,
                    priority: priority,
                    notes: `Created from AI call quote. Original parts request ID: ${partsRequestId}. ${notes}`.trim(),
                    customer_notes: quoteData.call_outcome?.notes || ''
                }
            )
                
            console.log('✅ Parts request created:', newPartsRequest)
            // Update the new parts request with quote data and mark as quoted
            console.log('🔧 Adding quote to parts request:', {
                id: newPartsRequest.id,
                shopId,
                quoteData,
                actualCost: quoteData.quote_details?.total_cost
            })
            
            await PartsService.addQuoteToPartsRequest(
                newPartsRequest.id,
                shopId,
                quoteData,
                quoteData.quote_details?.total_cost
            )

            // Update status to ordered
            console.log('🔧 Updating parts request status to ordered:', {
                id: newPartsRequest.id,
                shopId,
                status: 'ordered',
                notes: `Order placed via AI Parts Sourcing. Call ID: ${callId}`
            })
            
            await PartsService.updatePartsRequestStatus(
                newPartsRequest.id,
                shopId,
                'ordered',
                `Order placed via AI Parts Sourcing. Call ID: ${callId}`
            )

            toast.success('Parts order created successfully!')
            
            // Reset form after order
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
            
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-6 max-w-4xl mx-auto w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            AI Parts Ordering
                        </h1>
                        <p className="text-gray-400">
                            Fill out the form below and Mia AI will call suppliers for quotes
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Call Status Display */}
                        {callStatus === 'calling' && (
                            <Card className="bg-blue-50 border border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                                        <span className="text-blue-800 font-medium">
                                            Calling {selectedSuppliers[0]?.name}... Please wait.
                                        </span>
                                    </div>
                                    <p className="text-blue-600 text-sm mt-2">
                                        Mia AI is speaking with the supplier to get your quote.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {callStatus === 'completed' && quoteData && (
                            <Card className="bg-green-50 border border-green-200">
                                <CardHeader>
                                    <CardTitle className="text-green-800 flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Quote Received!
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {quoteData.parts_info && quoteData.parts_info.length > 0 ? (
                                        <div className="space-y-3">
                                            {quoteData.parts_info.map((part: any, index: number) => (
                                                <div key={index} className="bg-white p-3 rounded-lg border">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{part.part_name}</h4>
                                                            {part.part_number && (
                                                                <p className="text-sm text-gray-600">Part #: {part.part_number}</p>
                                                            )}
                                                            {part.vehicle_application && (
                                                                <p className="text-sm text-gray-600">For: {part.vehicle_application}</p>
                                                            )}
                                                            <p className="text-sm text-gray-600">Qty: {part.quantity}</p>
                                                            {part.availability && (
                                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                                    part.availability === 'in_stock' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {part.availability.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold text-green-600">
                                                                ${part.unit_price?.toFixed(2) || 'N/A'}
                                                            </p>
                                                            {part.delivery_days && (
                                                                <p className="text-sm text-gray-600">
                                                                    {part.delivery_days} days delivery
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {quoteData.quote_details && (
                                                <div className="bg-gray-50 p-3 rounded-lg border-t-2 border-green-500">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-lg font-semibold text-gray-900">Total:</span>
                                                        <span className="text-2xl font-bold text-green-600">
                                                            ${quoteData.quote_details.total_cost?.toFixed(2) || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {quoteData.quote_details.shipping_cost && (
                                                        <p className="text-sm text-gray-600">
                                                            Includes ${quoteData.quote_details.shipping_cost.toFixed(2)} shipping
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="flex gap-3 pt-3">
                                                <Button 
                                                    onClick={handlePlaceOrder}
                                                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                                >
                                                    <Package className="h-4 w-4 mr-2" />
                                                    Create Parts Order
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setCallStatus('idle')
                                                        setQuoteData(null)
                                                    }}
                                                    className="border-green-300 text-green-700 hover:bg-green-50"
                                                >
                                                    Get Another Quote
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-green-700">Call completed, but no quote details available.</p>
                                            <Button 
                                                variant="outline"
                                                onClick={() => setCallStatus('idle')}
                                                className="mt-3"
                                            >
                                                Start New Quote Request
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {callStatus === 'failed' && (
                            <Card className="bg-red-50 border border-red-200">
                                <CardContent className="p-4">
                                    <div className="text-red-800">
                                        <p className="font-medium">Call failed</p>
                                        <p className="text-sm text-red-600">Please check the phone number and try again.</p>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setCallStatus('idle')}
                                            className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Supplier Information */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Building className="h-5 w-5 text-blue-400" />
                                    Supplier Selection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SupplierMultiSelect
                                    selectedSuppliers={selectedSuppliers}
                                    onSuppliersChange={handleSuppliersChange}
                                    label="Select Suppliers"
                                    placeholder="Choose suppliers to request quotes from..."
                                />
                            </CardContent>
                        </Card>

                        {/* Vehicle Information */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Car className="h-5 w-5 text-green-400" />
                                    Vehicle Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-white">Year</Label>
                                        <Input
                                            value={vehicleInfo.year}
                                            onChange={(e) => handleVehicleChange('year', e.target.value)}
                                            placeholder="2020"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Make</Label>
                                        <Input
                                            value={vehicleInfo.make}
                                            onChange={(e) => handleVehicleChange('make', e.target.value)}
                                            placeholder="Toyota"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Model</Label>
                                        <Input
                                            value={vehicleInfo.model}
                                            onChange={(e) => handleVehicleChange('model', e.target.value)}
                                            placeholder="Camry"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-white">VIN</Label>
                                        <Input
                                            value={vehicleInfo.vin}
                                            onChange={(e) => handleVehicleChange('vin', e.target.value)}
                                            placeholder="Enter VIN number"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Mileage</Label>
                                        <Input
                                            value={vehicleInfo.mileage}
                                            onChange={(e) => handleVehicleChange('mileage', e.target.value)}
                                            placeholder="50,000"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Engine</Label>
                                        <Input
                                            value={vehicleInfo.engine}
                                            onChange={(e) => handleVehicleChange('engine', e.target.value)}
                                            placeholder="2.5L 4-Cylinder"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Parts Information */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Package className="h-5 w-5 text-yellow-400" />
                                    Parts Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-white">Part Name</Label>
                                        <Input
                                            value={partInfo.partName}
                                            onChange={(e) => handlePartChange('partName', e.target.value)}
                                            placeholder="Brake Pads"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Part Number</Label>
                                        <Input
                                            value={partInfo.partNumber}
                                            onChange={(e) => handlePartChange('partNumber', e.target.value)}
                                            placeholder="BP-123456"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-white">Quantity</Label>
                                        <Input
                                            type="number"
                                            value={partInfo.quantity}
                                            onChange={(e) => handlePartChange('quantity', parseInt(e.target.value) || 1)}
                                            min="1"
                                            className="bg-gray-900 border-gray-700 text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-white">Description</Label>
                                    <Textarea
                                        value={partInfo.description}
                                        onChange={(e) => handlePartChange('description', e.target.value)}
                                        placeholder="Additional details about the part needed..."
                                        className="bg-gray-900 border-gray-700 text-white"
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Options */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Send className="h-5 w-5 text-purple-400" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-white">Priority</Label>
                                        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-white">Internal Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Internal notes for this parts request..."
                                        className="bg-gray-900 border-gray-700 text-white"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-center">
                            <Button
                                onClick={handleStartCall}
                                disabled={isCalling || selectedSuppliers.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                            >
                                <Phone className="h-5 w-5 mr-2" />
                                {isCalling ? 'Mia is calling...' : 'Start AI Call'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
