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

    const handleInputChange = (field: keyof AdminShopFormData, value: string | number) => {
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

    const handleOperatingHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
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
        <Card className="bg-slate-50 dark:bg-card border-border">
            <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Shop Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Shop Information */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Shop Name *</Label>
                            <Input
                                value={shopForm.shopName}
                                onChange={(e) => handleInputChange('shopName', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop name"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Shop Email *</Label>
                            <Input
                                type="email"
                                value={shopForm.shopEmail}
                                onChange={(e) => handleInputChange('shopEmail', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop email"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Shop Phone *</Label>
                            <Input
                                value={shopForm.shopPhone}
                                onChange={(e) => handleInputChange('shopPhone', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop phone"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Website</Label>
                            <Input
                                value={shopForm.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter website URL"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Owner Name</Label>
                            <Input
                                value={shopForm.shopOwner || ''}
                                onChange={(e) => handleInputChange('shopOwner', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter owner name"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Default Hourly Rate ($)</Label>
                            <Input
                                type="number"
                                min="1"
                                max="1000"
                                step="0.01"
                                value={shopForm.defaultHourlyRate || 99.99}
                                onChange={(e) => {
                                    const numValue = e.target.value ? parseFloat(e.target.value) : 99.99
                                    handleInputChange('defaultHourlyRate', isNaN(numValue) ? 99.99 : numValue)
                                }}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="99.99"
                            />
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Label className="text-muted-foreground">Address *</Label>
                            <Input
                                value={shopForm.shopAddress}
                                onChange={(e) => handleInputChange('shopAddress', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop address"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">City *</Label>
                            <Input
                                value={shopForm.shopCity}
                                onChange={(e) => handleInputChange('shopCity', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter city"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Province *</Label>
                            <Input
                                value={shopForm.shopProvince}
                                onChange={(e) => handleInputChange('shopProvince', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter province"
                            />
                        </div>
                    </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Business Number</Label>
                            <Input
                                value={shopForm.businessNumber || ''}
                                onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter business number"
                            />
                        </div>
                        <div>
                            <Label className="text-muted-foreground">HST Number</Label>
                            <Input
                                value={shopForm.hstNumber || ''}
                                onChange={(e) => handleInputChange('hstNumber', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter HST number"
                            />
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium">Additional Information</h3>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-muted-foreground">Shop Tagline</Label>
                            <Input
                                value={shopForm.shopTagline || ''}
                                onChange={(e) => handleInputChange('shopTagline', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop tagline (optional)"
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground mt-1">A short tagline describing your shop (max 100 characters)</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">About Section</Label>
                            <Textarea
                                value={shopForm.shopAbout || ''}
                                onChange={(e) => handleInputChange('shopAbout', e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500"
                                placeholder="Enter shop description (optional)"
                                rows={4}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground mt-1">A detailed description of your shop (max 500 characters)</p>
                        </div>
                    </div>
                </div>

                {/* Services Offered */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium">Services Offered</h3>
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
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                            >
                                {service}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Operating Hours */}
                <div className="space-y-4">
                    <h3 className="text-foreground font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Operating Hours
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(shopForm.operatingHours).map(([day, hours]) => (
                            <div key={day} className="flex items-center gap-4">
                                <div className="w-20 text-sm text-muted-foreground capitalize">
                                    {day}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={hours.closed}
                                        onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
                                        className="rounded border-border bg-white dark:bg-background text-red-600 dark:text-red-400 focus:ring-red-600 dark:focus:ring-red-500"
                                    />
                                    <span className="text-sm text-muted-foreground">Closed</span>
                                </div>
                                {!hours.closed && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={hours.open || ''}
                                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500 w-32"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="time"
                                            value={hours.close || ''}
                                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground focus:ring-red-600 dark:focus:ring-red-500 w-32"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                        <ul className="text-red-600 dark:text-red-400 text-sm space-y-1">
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
