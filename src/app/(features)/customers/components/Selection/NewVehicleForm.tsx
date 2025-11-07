'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleService } from '../../lib/vehicle-service'
import { VEHICLE_MAKES } from '../../types/vehicle'
import type { VehicleFormData, VehicleOption } from '../../types/vehicle'
import { toast } from 'sonner'
import { Save, Loader2, X } from 'lucide-react'

interface NewVehicleFormProps {
    customerId: string
    onVehicleCreated: (vehicle: VehicleOption) => void
    onCancel: () => void
    isLoading?: boolean
}

export function NewVehicleForm({
    customerId,
    onVehicleCreated,
    onCancel,
    isLoading = false
}: NewVehicleFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState<VehicleFormData>({
        year: new Date().getFullYear().toString(),
        make: '',
        model: '',
        color: '',
        vin: '',
        licensePlate: '',
        mileage: ''
    })

    const handleInputChange = (field: keyof VehicleFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        // Clear field error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.year.trim()) {
            newErrors.year = 'Year is required'
        } else {
            const year = parseInt(formData.year)
            const currentYear = new Date().getFullYear()
            if (year < 1970 || year > currentYear + 1) {
                newErrors.year = `Year must be between 1970 and ${currentYear + 1}`
            }
        }

        if (!formData.make.trim()) {
            newErrors.make = 'Make is required'
        }

        if (!formData.model.trim()) {
            newErrors.model = 'Model is required'
        }

        if (formData.vin && formData.vin.length !== 17) {
            newErrors.vin = 'VIN must be exactly 17 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validateForm()) return

        setIsSaving(true)
        try {
            const vehicleData: VehicleFormData = {
                year: formData.year.trim(),
                make: formData.make.trim(),
                model: formData.model.trim(),
                color: formData.color?.trim() || undefined,
                vin: formData.vin?.trim() || undefined,
                licensePlate: formData.licensePlate?.trim() || undefined,
                mileage: formData.mileage?.trim() || undefined,
            }

            const savedVehicle = await VehicleService.createVehicle(customerId, vehicleData)

            toast.success(`Vehicle "${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}" created successfully`)

            // Convert to VehicleOption and notify parent
            const vehicleOption: VehicleOption = {
                id: savedVehicle.id,
                displayName: `${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}`,
                year: savedVehicle.year,
                make: savedVehicle.make,
                model: savedVehicle.model,
                licensePlate: savedVehicle.license_plate,
                color: savedVehicle.color,
                vin: savedVehicle.vin
            }

            onVehicleCreated(vehicleOption)

        } catch (error: any) {
            console.error('Error saving vehicle:', error)
            toast.error(error.message || 'Failed to save vehicle')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="bg-slate-50 dark:bg-card border-border p-4 mt-4">
            <CardHeader className="pb-3">
                <CardTitle className="text-md font-medium text-foreground flex items-center justify-between">
                    New Vehicle Details
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isSaving}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Year, Make, Model Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <Label className="text-muted-foreground text-xs">Year *</Label>
                        <Input
                            type="number"
                            value={formData.year}
                            onChange={(e) => handleInputChange('year', e.target.value)}
                            placeholder="2023"
                            min="1970"
                            max={new Date().getFullYear() + 1}
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                            disabled={isSaving}
                        />
                        {errors.year && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.year}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-muted-foreground text-xs">Make *</Label>
                        <Select
                            value={formData.make}
                            onValueChange={(value) => handleInputChange('make', value)}
                            disabled={isSaving}
                        >
                            <SelectTrigger className="bg-white dark:bg-background text-foreground border-border text-sm">
                                <SelectValue placeholder="Select make" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-background border-border text-foreground">
                                {VEHICLE_MAKES.map((make) => (
                                    <SelectItem key={make} value={make} className="hover:bg-muted">
                                        {make}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.make && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.make}</p>
                        )}
                    </div>

                    <div>
                        <Label className="text-muted-foreground text-xs">Model *</Label>
                        <Input
                            value={formData.model}
                            onChange={(e) => handleInputChange('model', e.target.value)}
                            placeholder="Camry"
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                            disabled={isSaving}
                        />
                        {errors.model && (
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.model}</p>
                        )}
                    </div>
                </div>

                {/* Color */}
                <div>
                    <Label className="text-muted-foreground text-xs">Color</Label>
                    <Input
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        placeholder="Red"
                        className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                        disabled={isSaving}
                    />
                </div>

                {/* VIN */}
                <div>
                    <Label className="text-muted-foreground text-xs">VIN</Label>
                    <Input
                        value={formData.vin}
                        onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                        placeholder="17-digit VIN"
                        maxLength={17}
                        className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                        disabled={isSaving}
                    />
                    {errors.vin && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.vin}</p>
                    )}
                </div>

                {/* License Plate and Mileage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label className="text-muted-foreground text-xs">License Plate</Label>
                        <Input
                            value={formData.licensePlate}
                            onChange={(e) => handleInputChange('licensePlate', e.target.value.toUpperCase())}
                            placeholder="ABC-123"
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                            disabled={isSaving}
                        />
                    </div>

                    <div>
                        <Label className="text-muted-foreground text-xs">Mileage</Label>
                        <Input
                            type="number"
                            value={formData.mileage}
                            onChange={(e) => handleInputChange('mileage', e.target.value)}
                            placeholder="50000"
                            className="bg-white dark:bg-background text-foreground border-border text-sm focus:ring-red-600 dark:focus:ring-red-500"
                            disabled={isSaving}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !formData.year.trim() || !formData.make.trim() || !formData.model.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Vehicle
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default NewVehicleForm
