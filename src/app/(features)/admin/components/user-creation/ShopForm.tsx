'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, MapPin, Globe, Clock } from 'lucide-react'
import { AdminShopFormData } from '../../types/user-creation'

interface ShopFormProps {
    shopForm: AdminShopFormData
    setShopForm: (form: AdminShopFormData) => void
    errors: string[]
}

const defaultOperatingHours = {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '15:00', closed: false },
    sunday: { open: '', close: '', closed: true }
}

const serviceOptions = [
    'Oil Change',
    'Brake Service',
    'Engine Repair',
    'Transmission Service',
    'Tire Service',
    'AC Service',
    'Diagnostic',
    'Preventive Maintenance',
    'Body Work',
    'Paint Service'
]

export default function ShopForm({ shopForm, setShopForm, errors }: ShopFormProps) {
    const [selectedServices, setSelectedServices] = useState<string[]>(shopForm.servicesOffered)

    const handleInputChange = (field: keyof AdminShopFormData, value: string) => {
        setShopForm({
            ...shopForm,
            [field]: value
        })
    }

    const handleServiceToggle = (service: string) => {
        const updated = selectedServices.includes(service)
            ? selectedServices.filter(s => s !== service)
            : [...selectedServices, service]
        
        setSelectedServices(updated)
        setShopForm({
            ...shopForm,
            servicesOffered: updated
        })
    }

    const handleOperatingHoursChange = (day: string, field: 'openTime' | 'closeTime' | 'closed', value: string | boolean) => {
        setShopForm({
            ...shopForm,
            operatingHours: {
                ...shopForm.operatingHours,
                [day]: {
                    ...shopForm.operatingHours[day as keyof typeof shopForm.operatingHours],
                    [field]: value
                }
            }
        })
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Shop Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Shop Information */}
                <div className="space-y-4">
                    <h3 className="text-white font-medium">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">Shop Name *</Label>
                            <Input
                                value={shopForm.shopName}
                                onChange={(e) => handleInputChange('shopName', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter shop name"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Shop Email</Label>
                            <Input
                                type="email"
                                value={shopForm.shopEmail}
                                onChange={(e) => handleInputChange('shopEmail', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter shop email"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Shop Phone</Label>
                            <Input
                                value={shopForm.shopPhone}
                                onChange={(e) => handleInputChange('shopPhone', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter shop phone"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Website</Label>
                            <Input
                                value={shopForm.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter website URL"
                            />
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label className="text-gray-300">Address *</Label>
                            <Input
                                value={shopForm.shopAddress}
                                onChange={(e) => handleInputChange('shopAddress', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter shop address"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">City *</Label>
                            <Input
                                value={shopForm.shopCity}
                                onChange={(e) => handleInputChange('shopCity', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter city"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">Province *</Label>
                            <Input
                                value={shopForm.shopProvince}
                                onChange={(e) => handleInputChange('shopProvince', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter province"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                    <h3 className="text-white font-medium">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-300">Business Number</Label>
                            <Input
                                value={shopForm.businessNumber}
                                onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter business number"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-300">HST Number</Label>
                            <Input
                                value={shopForm.hstNumber}
                                onChange={(e) => handleInputChange('hstNumber', e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                                placeholder="Enter HST number"
                            />
                        </div>
                    </div>
                </div>

                {/* Services Offered */}
                <div className="space-y-4">
                    <h3 className="text-white font-medium">Services Offered</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {serviceOptions.map((service) => (
                            <Button
                                key={service}
                                type="button"
                                variant={selectedServices.includes(service) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleServiceToggle(service)}
                                className={
                                    selectedServices.includes(service)
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
                                }
                            >
                                {service}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-4">
                    <h3 className="text-white font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Operating Hours
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(shopForm.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4">
                                <div className="w-20 text-sm text-gray-300 capitalize">
                                    {day}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={hours.closed}
                                        onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                                        className="rounded border-[#2a2a2a] bg-[#1a1a1a]"
                                    />
                                    <span className="text-sm text-gray-400">Closed</span>
                                </div>
                                {!hours.closed && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={hours.open || ''}
                                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white w-32"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <Input
                                            type="time"
                                            value={hours.close || ''}
                                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white w-32"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                        <ul className="text-red-400 text-sm space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
