'use client'

import React, { useState } from 'react'
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

export default function VoiceOrderingPage() {
    const [selectedSuppliers, setSelectedSuppliers] = useState<SelectedSupplier[]>([])
    const [isCalling, setIsCalling] = useState(false)

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
            toast.success(`Mia AI is calling ${selectedSuppliers[0].name}...`)
            
            // Reset form after successful call
            setTimeout(() => {
                setSelectedSuppliers([])
                setVehicleInfo({ year: '', make: '', model: '', vin: '', mileage: '', engine: '' })
                setPartInfo({ partName: '', partNumber: '', quantity: 1, description: '' })
                setPriority('normal')
                setNotes('')
                toast.info('Call completed - form reset for next request')
            }, 3000)

        } catch (error: any) {
            console.error('Error starting call:', error)
            toast.error(error.message || 'Failed to start call')
        } finally {
            setIsCalling(false)
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
