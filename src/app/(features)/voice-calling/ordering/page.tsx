'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Nav } from '@/app/components/nav'
import { Package, Car, Building, FileText, Send, Phone } from 'lucide-react'
import SupplierMultiSelect from '@/app/(features)/suppliers/components/supplier-multi-select'
import { PartsRequestService } from '@/app/(features)/voice-calling/lib/parts-request-service'
import { MiaCallingService } from '@/app/(features)/voice-calling/lib/mia-calling-service'
import QuoteDisplay from '@/app/(features)/voice-calling/components/QuoteDisplay'
import VapiWebClient from '@/app/(features)/voice-calling/components/VapiWebClient'
import { toast } from 'sonner'
import { 
    VehicleInfo, 
    PartItem, 
    SelectedSupplier, 
    CreatePartsRequestData,
    PartsRequestPriority 
} from '@/app/(features)/voice-calling/types'
import PartsRequestsList from '@/app/(features)/parts/components/parts-requests-list'

export default function VoiceOrderingPage() {
    const [selectedSuppliers, setSelectedSuppliers] = useState<SelectedSupplier[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
        year: '',
        make: '',
        model: '',
        vin: '',
        mileage: '',
        engine: ''
    })

    const [partInfo, setPartInfo] = useState<PartItem>({
        partName: '',
        partNumber: '',
        quantity: 1,
        description: ''
    })

    const [priority, setPriority] = useState<PartsRequestPriority>('normal')
    const [notes, setNotes] = useState('')
    const [customerNotes, setCustomerNotes] = useState('')
    
    // Workflow state tracking
    const [currentPhase, setCurrentPhase] = useState<'preparation' | 'calling' | 'completed' | 'review'>('preparation')
    const [createdPartsRequestId, setCreatedPartsRequestId] = useState<string | null>(null)
    const [currentCallIndex, setCurrentCallIndex] = useState(-1)
    const [callResults, setCallResults] = useState<any[]>([])
    const [quotesReceived, setQuotesReceived] = useState<any[]>([])
    const [isCallingInProgress, setIsCallingInProgress] = useState(false)

    const handleRecallRequest = (request: any) => {
        try {
            const v = request?.vehicle_info || {}
            setVehicleInfo({
                year: v.year || '',
                make: v.make || '',
                model: v.model || '',
                vin: v.vin || '',
                mileage: v.mileage || '',
                engine: v.engine || ''
            })

            const firstPart = Array.isArray(request?.parts_requested) && request.parts_requested.length > 0
                ? request.parts_requested[0]
                : null
            if (firstPart) {
                setPartInfo({
                    partName: firstPart.partName || firstPart.part_name || '',
                    partNumber: firstPart.partNumber || firstPart.part_number || '',
                    quantity: firstPart.quantity || 1,
                    description: firstPart.description || ''
                })
            }

            const suppliers = request?.supplier_info?.selected_suppliers || []
            setSelectedSuppliers(suppliers)

            if (request?.priority) setPriority(request.priority)
            setNotes(request?.notes || '')
            setCustomerNotes(request?.customer_notes || '')

            toast.success('Loaded previous request details into the form')
        } catch (e: any) {
            toast.error('Failed to load previous request')
        }
    }

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

    const handlePrintJSON = () => {
        const orderData = {
            suppliers: selectedSuppliers,
            vehicle: vehicleInfo,
            parts: partInfo,
            priority,
            notes,
            customerNotes,
            timestamp: new Date().toISOString()
        }

        console.log('Order Data JSON:', JSON.stringify(orderData, null, 2))
        alert('Order data printed to console! Check the browser developer tools.')
    }

    const handleSubmitPartsRequest = async () => {
        // Validation
        if (selectedSuppliers.length === 0) {
            toast.error('Please select at least one supplier')
            return
        }

        if (!vehicleInfo.year?.trim() || !vehicleInfo.make?.trim() || !vehicleInfo.model?.trim()) {
            toast.error('Please provide vehicle year, make, and model')
            return
        }

        if (!partInfo.partName?.trim()) {
            toast.error('Please provide a part name')
            return
        }

        try {
            setIsSubmitting(true)

            // Prepare data for API
            const requestData: CreatePartsRequestData = {
                vehicle_info: {
                    year: vehicleInfo.year,
                    make: vehicleInfo.make,
                    model: vehicleInfo.model,
                    vin: vehicleInfo.vin || undefined,
                    mileage: vehicleInfo.mileage || undefined,
                    engine: vehicleInfo.engine || undefined
                },
                parts_requested: [{
                    partName: partInfo.partName,
                    partNumber: partInfo.partNumber || undefined,
                    quantity: partInfo.quantity,
                    description: partInfo.description || undefined
                }],
                supplier_info: {
                    selected_suppliers: selectedSuppliers
                },
                priority,
                notes: notes || undefined,
                customer_notes: customerNotes || undefined
            }

            console.log('📤 Submitting parts request:', requestData)

            const result = await PartsRequestService.createPartsRequest(requestData)
            
            // Following workflow: Parts Request Created (Status: "pending", Ready for AI call)
            setCreatedPartsRequestId(result.id)
            setCurrentPhase('calling')
            
            toast.success(`Parts request created successfully! ID: ${result.id}`)
            console.log('✅ Parts request created (Status: pending, Ready for AI call):', result)

            // Don't reset form yet - user needs to proceed to AI calling phase

        } catch (error: any) {
            console.error('❌ Error submitting parts request:', error)
            toast.error(error.message || 'Failed to submit parts request')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStartMiaCalls = async () => {
        if (!createdPartsRequestId) {
            toast.error('No parts request created')
            return
        }

        try {
            setIsCallingInProgress(true)
            setCurrentCallIndex(0)
            const results: any[] = []

            // Call each supplier sequentially
            for (let i = 0; i < selectedSuppliers.length; i++) {
                const supplier = selectedSuppliers[i]
                setCurrentCallIndex(i)

                toast.info(`Starting Mia AI call to ${supplier.name}...`)

                try {
                    // Start Mia AI call with pre-configured assistant
                    const callResult = await MiaCallingService.startMiaCall({
                        supplier_phone_number: supplier.phone_number || '',
                        supplier_name: supplier.name,
                        supplier_contact_person: supplier.contact_person,
                        parts_request_id: createdPartsRequestId,
                        vehicle_info: vehicleInfo,
                        parts_info: partInfo
                    })

                    console.log(`📞 Call initiated for ${supplier.name}:`, callResult)

                    // Wait for call to complete naturally (no polling needed!)
                    toast.info(`Mia is calling ${supplier.name}... Call will end automatically when quote is received`)
                    
                    try {
                        // Give the call time to complete naturally (90 seconds)
                        await MiaCallingService.waitForCallCompletion(90000)
                        
                        // Check if quote was saved
                        const completedRequest = await MiaCallingService.checkForQuote(createdPartsRequestId)
                        
                        if (completedRequest && completedRequest.quote_provided) {
                            results.push({
                                supplier,
                                callResult,
                                quote: completedRequest.quote_provided,
                                success: true
                            })
                            toast.success(`Quote received from ${supplier.name}!`)
                        } else {
                            results.push({
                                supplier,
                                callResult,
                                error: 'No quote received yet - call may have taken longer than expected',
                                success: false,
                                canRetry: true
                            })
                            toast.warning(`Call to ${supplier.name} completed but no quote found yet. You can check again later.`)
                        }
                    } catch (waitError: any) {
                        console.error(`Call wait failed for ${supplier.name}:`, waitError)
                        results.push({
                            supplier,
                            callResult,
                            error: waitError?.message || 'Call wait failed',
                            success: false,
                            canRetry: true
                        })
                        toast.error(`Issue with call to ${supplier.name}: ${waitError.message}`)
                    }

                } catch (callError: any) {
                    console.error(`Call failed for ${supplier.name}:`, callError)
                    results.push({
                        supplier,
                        error: callError.message,
                        success: false
                    })
                    toast.error(`Failed to call ${supplier.name}: ${callError.message}`)
                }

                // Small delay between calls
                if (i < selectedSuppliers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            }

            setCallResults(results)
            
            // Extract successful quotes
            const quotes = results
                .filter(r => r.success && r.quote)
                .map(r => r.quote)
            
            setQuotesReceived(quotes)
            setCurrentPhase('completed')
            
            toast.success(`Completed calls to ${selectedSuppliers.length} suppliers. ${quotes.length} quotes received.`)

        } catch (error: any) {
            console.error('❌ Error in Mia AI calling process:', error)
            toast.error(error.message || 'Failed to complete supplier calls')
        } finally {
            setIsCallingInProgress(false)
            setCurrentCallIndex(-1)
        }
    }

    const handleCheckForQuotes = async () => {
        if (!createdPartsRequestId) return

        try {
            toast.info('Checking for new quotes...')
            const partsRequest = await MiaCallingService.checkForQuote(createdPartsRequestId)
            
            if (partsRequest && partsRequest.quote_provided) {
                setQuotesReceived([partsRequest.quote_provided])
                toast.success('Quote found and loaded!')
                setCurrentPhase('completed')
            } else {
                toast.info('No new quotes found yet. The call may still be in progress.')
            }
        } catch (error: any) {
            console.error('Error checking for quotes:', error)
            toast.error('Failed to check for quotes')
        }
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-auto">
                <div className="p-6 max-w-4xl mx-auto w-full">
                    {/* Workflow Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            AI Parts Ordering
                        </h1>
                        
                        {/* Workflow Phase Indicator */}
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                currentPhase === 'preparation' ? 'bg-blue-600 text-white' : 
                                (currentPhase === 'calling' || currentPhase === 'completed' || currentPhase === 'review') ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                Shop Owner Preparation
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                currentPhase === 'calling' ? 'bg-blue-600 text-white' : 
                                currentPhase === 'completed' || currentPhase === 'review' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                AI Call Initiation
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                currentPhase === 'review' ? 'bg-blue-600 text-white' : 
                                currentPhase === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                Shop Owner Review
                            </div>
                        </div>

                        <p className="text-gray-400">
                            {currentPhase === 'preparation' && 'Fill out the form below to request parts quotes'}
                            {currentPhase === 'calling' && 'Parts request created - Ready to initiate AI call'}
                            {currentPhase === 'completed' && 'AI call completed - Quote received'}
                            {currentPhase === 'review' && 'Review quote and approve order'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* PHASE 1: SHOP OWNER PREPARATION - Show forms only during preparation */}
                        {currentPhase === 'preparation' && (
                            <>
                        {/* Previous Requests */}
                        <Card className="bg-[#111111] border-[#2a2a2a]">
                            <CardHeader>
                                <CardTitle className="text-white">Previous Parts Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PartsRequestsList onRecall={handleRecallRequest} limit={10} />
                            </CardContent>
                        </Card>

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
                                    <FileText className="h-5 w-5 text-purple-400" />
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
                                <div>
                                    <Label className="text-white">Customer Notes</Label>
                                    <Textarea
                                        value={customerNotes}
                                        onChange={(e) => setCustomerNotes(e.target.value)}
                                        placeholder="Notes to share with the customer..."
                                        className="bg-gray-900 border-gray-700 text-white"
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Buttons */}
                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={handleSubmitPartsRequest}
                                disabled={isSubmitting || selectedSuppliers.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                            >
                                <Send className="h-5 w-5 mr-2" />
                                {isSubmitting ? 'Creating Parts Request...' : 'Create Parts Request'}
                            </Button>
                        </div>
                            </>
                        )}

                        {/* PHASE 2: AI CALL INITIATION - Show when parts request is created */}
                        {currentPhase === 'calling' && createdPartsRequestId && (
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-blue-400" />
                                        AI Call Initiation Phase
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 mb-4">
                                            <p className="text-green-400 font-medium">✅ Parts Request Created Successfully!</p>
                                            <p className="text-gray-300 text-sm">ID: {createdPartsRequestId}</p>
                                            <p className="text-gray-300 text-sm">Status: Pending → Ready for AI Call</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <p className="text-white text-lg">Ready to call suppliers for quotes</p>
                                            <p className="text-gray-400">
                                                Mia will call each selected supplier to request pricing and availability for:
                                            </p>
                                            
                                            {/* Show summary of what will be called about */}
                                            <div className="bg-gray-900 rounded-lg p-4 text-left">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-blue-400 font-medium">Vehicle:</p>
                                                        <p className="text-gray-300">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-green-400 font-medium">Parts:</p>
                                                        <p className="text-gray-300">{partInfo.quantity}x {partInfo.partName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-yellow-400 font-medium">Suppliers:</p>
                                                        <p className="text-gray-300">{selectedSuppliers.length} supplier(s)</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                            <Button
                                onClick={handleStartMiaCalls}
                                disabled={isCallingInProgress}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50"
                            >
                                <Phone className="h-5 w-5 mr-2" />
                                {isCallingInProgress 
                                    ? `Mia is calling... (${currentCallIndex + 1}/${selectedSuppliers.length})`
                                    : 'Start Mia AI Calls to Suppliers'
                                }
                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* PHASE 3: INFORMATION RECEIVED & REVIEW - Show quote results */}
                        {(currentPhase === 'completed' || currentPhase === 'review') && (
                            <Card className="bg-[#111111] border-[#2a2a2a]">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Package className="h-5 w-5 text-green-400" />
                                        Quote Results & Review
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="bg-green-600/20 border border-green-500 rounded-lg p-4 mb-4">
                                            <p className="text-green-400 font-medium">✅ AI Calls Completed!</p>
                                            <p className="text-gray-300 text-sm">Status: Quoted → Ready for Review</p>
                                        </div>
                                        
                        <p className="text-white text-lg mb-4">
                            {quotesReceived.length > 0 
                                ? `${quotesReceived.length} quote(s) received from suppliers`
                                : 'No quotes received yet'
                            }
                        </p>
                        
                        {/* Display Quotes */}
                        {quotesReceived.length > 0 ? (
                            <div className="space-y-4">
                                {quotesReceived.map((quote, index) => (
                                    <QuoteDisplay 
                                        key={index} 
                                        quote={quote}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-900 rounded-lg p-6 text-center">
                                <p className="text-gray-400">No quotes available to display</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Complete the AI calling process to see quotes here
                                </p>
                            </div>
                        )}
                                        
                                        <div className="flex justify-center gap-4 mt-6">
                                            <Button
                                                onClick={() => {
                                                    toast.success('Order approved and placed!')
                                                    // TODO: Implement order placement
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                                            >
                                                Approve & Place Order
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    // Reset form and start over
                                                    setCurrentPhase('preparation')
                                                    setCreatedPartsRequestId(null)
                                                    setSelectedSuppliers([])
                                                    setVehicleInfo({
                                                        year: '',
                                                        make: '',
                                                        model: '',
                                                        vin: '',
                                                        mileage: '',
                                                        engine: ''
                                                    })
                                                    setPartInfo({
                                                        partName: '',
                                                        partNumber: '',
                                                        quantity: 1,
                                                        description: ''
                                                    })
                                                    setPriority('normal')
                                                    setNotes('')
                                                    setCustomerNotes('')
                                                    setCallResults([])
                                                    setQuotesReceived([])
                                                    setCurrentCallIndex(-1)
                                                    setIsCallingInProgress(false)
                                                    toast.info('Starting new parts request')
                                                }}
                                                variant="outline"
                                                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2"
                                            >
                                                Start New Request
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
