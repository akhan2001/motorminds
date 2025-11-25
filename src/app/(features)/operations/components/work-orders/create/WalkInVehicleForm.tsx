'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { decodeVin } from '@/app/(features)/customers/vehicles/lib/vin-decode'
import { VehicleSearchByPlate } from '../../../../customers/components/vehicles'
import { VEHICLE_MAKES } from '../../../../customers/types/vehicle'
import type { WalkInVehicleInfo, CustomerVehicle } from '../../../../customers/types/vehicle'

interface WalkInVehicleFormProps {
    data: WalkInVehicleInfo
    onDataChange: (data: WalkInVehicleInfo) => void
    shopId: string
    onVehicleSelected?: (vehicleId: string) => void
    onVehicleCreated?: (vehicleId: string) => void
    isEditing?: boolean
    className?: string
}

export const WalkInVehicleForm: React.FC<WalkInVehicleFormProps> = ({
    data,
    onDataChange,
    shopId,
    onVehicleSelected,
    onVehicleCreated,
    isEditing = true,
    className = ""
}) => {
    const [errors, setErrors] = useState<Partial<Record<keyof WalkInVehicleInfo, string>>>({})
    const [vinDecoding, setVinDecoding] = useState(false)
    // Show custom make input if current make is not in the predefined list
    const [showCustomMake, setShowCustomMake] = useState(() => {
        return data.make ? !VEHICLE_MAKES.includes(data.make) : false
    })

    const handleFieldChange = (field: keyof WalkInVehicleInfo, value: string | number) => {
        const newData = { ...data, [field]: value }
        onDataChange(newData)
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateField = (field: keyof WalkInVehicleInfo, value: string | number | undefined): string | undefined => {
        if (value === undefined || value === '') {
            if (['year', 'make', 'model'].includes(field as string)) {
                const fieldName = field as string
                return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
            }
            return undefined
        }

        switch (field) {
            case 'year':
                const year = typeof value === 'string' ? parseInt(value) : value
                if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
                    return 'Please enter a valid year'
                }
                break
            case 'make':
                if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                    return 'Make is required'
                }
                break
            case 'model':
                if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                    return 'Model is required'
                }
                break
            case 'mileage':
                if (value && (typeof value === 'string' ? parseInt(value) : value) < 0) {
                    return 'Mileage must be a positive number'
                }
                break
        }
        return undefined
    }

    const handleBlur = (field: keyof WalkInVehicleInfo) => {
        const error = validateField(field, data[field])
        if (error) {
            setErrors(prev => ({ ...prev, [field]: error }))
        }
    }

    const isFormValid = () => {
        const requiredFields: (keyof WalkInVehicleInfo)[] = ['year', 'make', 'model']
        return requiredFields.every(field => {
            const value = data[field]
            return value && (typeof value === 'string' ? value.trim().length > 0 : true)
        })
    }

    // Handle VIN decoding
    const handleVinDecode = async () => {
        const vin = data.vin?.toString().trim() || ''
        
        if (!vin) {
            toast.error('Please enter a VIN number')
            return
        }

        if (vin.length !== 17) {
            toast.error('VIN must be 17 characters long')
            return
        }

        setVinDecoding(true)
        try {
            const decodedVehicle = await decodeVin(vin)
            
            console.log('Decoded vehicle data:', decodedVehicle)
            
            if (decodedVehicle) {
                // Convert year string to number
                const yearStr = decodedVehicle.year?.toString().trim()
                const yearNum = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear()
                
                // Convert make and model to proper case (Title Case)
                // Handle both spaces AND hyphens (e.g., 'MERCEDES-BENZ' -> 'Mercedes-Benz')
                const makeRaw = decodedVehicle.make || ''
                const modelRaw = decodedVehicle.model || ''
                
                const toProperCase = (str: string) => {
                    return str
                        .toLowerCase()
                        .split(/(\s+|-)/g) // Split on spaces OR hyphens, but keep delimiters
                        .map(part => {
                            // If it's a delimiter (space or hyphen), keep it as-is
                            if (part === ' ' || part === '-') return part
                            // Otherwise capitalize first letter
                            return part.charAt(0).toUpperCase() + part.slice(1)
                        })
                        .join('')
                }
                
                const makeProperCase = toProperCase(makeRaw)
                const modelProperCase = toProperCase(modelRaw)
                
                console.log('Year conversion:', { original: decodedVehicle.year, yearStr, yearNum })
                console.log('Make conversion:', { original: makeRaw, properCase: makeProperCase })
                console.log('Model conversion:', { original: modelRaw, properCase: modelProperCase })
                
                // Update all fields
                const updatedData = {
                    ...data,
                    year: yearNum,
                    make: makeProperCase || data.make,
                    model: modelProperCase || data.model
                }
                
                console.log('Updated vehicle data:', updatedData)
                onDataChange(updatedData)
                
                toast.success(`VIN decoded: ${yearNum} ${makeProperCase} ${modelProperCase}`)
            } else {
                toast.error('No vehicle data found for this VIN')
            }
        } catch (error: any) {
            console.error('VIN decode error:', error)
            toast.error(error.message || 'Failed to decode VIN')
        } finally {
            setVinDecoding(false)
        }
    }

    // Handle vehicle selection from search
    const handleVehicleSelected = (vehicle: CustomerVehicle) => {
        // Convert CustomerVehicle to WalkInVehicleInfo format
        const vehicleInfo: WalkInVehicleInfo = {
            year: vehicle.year ? parseInt(vehicle.year.toString()) : new Date().getFullYear(),
            make: vehicle.make || '',
            model: vehicle.model || '',
            license_plate: vehicle.license_plate || '',
            color: vehicle.color || '',
            vin: vehicle.vin || '',
            mileage: vehicle.mileage || undefined
        }
        
        onDataChange(vehicleInfo)
        
        // Notify parent if callback provided
        if (onVehicleSelected) {
            onVehicleSelected(vehicle.id)
        }
    }

    // Handle vehicle creation from search
    const handleVehicleCreated = (vehicle: CustomerVehicle) => {
        // Convert CustomerVehicle to WalkInVehicleInfo format and populate form
        const vehicleInfo: WalkInVehicleInfo = {
            year: vehicle.year ? parseInt(vehicle.year.toString()) : new Date().getFullYear(),
            make: vehicle.make || '',
            model: vehicle.model || '',
            license_plate: vehicle.license_plate || '',
            color: vehicle.color || '',
            vin: vehicle.vin || '',
            mileage: vehicle.mileage || undefined
        }
        
        onDataChange(vehicleInfo)
        
        // Notify parent if callback provided
        if (onVehicleCreated) {
            onVehicleCreated(vehicle.id)
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-foreground">Walk-in Vehicle Information</h3>
            
            {/* Vehicle Search */}
            {isEditing && (
                <div className="bg-slate-50 dark:bg-card rounded-xl p-6 border border-border">
                    <VehicleSearchByPlate
                        shopId={shopId}
                        onVehicleSelected={handleVehicleSelected}
                        onVehicleCreated={handleVehicleCreated}
                        disabled={!isEditing}
                    />
                </div>
            )}
            
            <div className="bg-slate-50 dark:bg-card rounded-xl p-6 border border-border">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="year" className="text-foreground">Year *</Label>
                            <Input
                                id="year"
                                type="number"
                                value={data.year || ''}
                                onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || '')}
                                onBlur={() => handleBlur('year')}
                                placeholder="2020"
                                disabled={!isEditing}
                                className={`bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 ${
                                    errors.year ? 'border-red-600 dark:border-red-500 focus:border-red-600' : ''
                                }`}
                                min="1900"
                                max={new Date().getFullYear() + 1}
                            />
                            {errors.year && (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.year}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="make" className="text-foreground">Make *</Label>
                            {showCustomMake ? (
                                <div className="space-y-2">
                                    <Input
                                        id="make"
                                        value={data.make || ''}
                                        onChange={(e) => handleFieldChange('make', e.target.value)}
                                        onBlur={() => handleBlur('make')}
                                        placeholder="Enter custom make"
                                        disabled={!isEditing}
                                        className={`bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 ${
                                            errors.make ? 'border-red-600 dark:border-red-500 focus:border-red-600' : ''
                                        }`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowCustomMake(false)
                                            handleFieldChange('make', '')
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Select from list
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={data.make && VEHICLE_MAKES.includes(data.make) ? data.make : ''}
                                    onValueChange={(value) => {
                                        if (value === 'custom') {
                                            setShowCustomMake(true)
                                        } else {
                                            handleFieldChange('make', value)
                                        }
                                    }}
                                    disabled={!isEditing}
                                >
                                    <SelectTrigger 
                                        id="make"
                                        className={`bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 ${
                                            errors.make ? 'border-red-600 dark:border-red-500 focus:border-red-600' : ''
                                        }`}
                                    >
                                        <SelectValue placeholder="Select make" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                        {VEHICLE_MAKES.map((make) => (
                                            <SelectItem key={make} value={make} className="hover:bg-accent dark:hover:bg-[#2a2a2a]">
                                                {make}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="custom" className="text-red-600 dark:text-red-400 hover:bg-accent dark:hover:bg-[#2a2a2a]">
                                            + Add New Vehicle Make
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            {errors.make && (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.make}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="model" className="text-foreground">Model *</Label>
                            <Input
                                id="model"
                                value={data.model || ''}
                                onChange={(e) => handleFieldChange('model', e.target.value)}
                                onBlur={() => handleBlur('model')}
                                placeholder="Camry"
                                disabled={!isEditing}
                                className={`bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 ${
                                    errors.model ? 'border-red-600 dark:border-red-500 focus:border-red-600' : ''
                                }`}
                            />
                            {errors.model && (
                                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.model}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="license_plate" className="text-foreground">License Plate</Label>
                            <Input
                                id="license_plate"
                                value={data.license_plate || ''}
                                onChange={(e) => handleFieldChange('license_plate', e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                disabled={!isEditing}
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="color" className="text-foreground">Color</Label>
                            <Input
                                id="color"
                                value={data.color || ''}
                                onChange={(e) => handleFieldChange('color', e.target.value)}
                                placeholder="Silver"
                                disabled={!isEditing}
                                className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vin" className="text-foreground">VIN</Label>
                            <div className="relative">
                                <Input
                                    id="vin"
                                    value={data.vin || ''}
                                    onChange={(e) => handleFieldChange('vin', e.target.value.toUpperCase())}
                                    placeholder="1HGBH41JXMN109186"
                                    disabled={!isEditing}
                                    className="bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 pr-20"
                                    maxLength={17}
                                />
                                {/* VIN Decoder Button */}
                                {isEditing && data.vin && data.vin.toString().length === 17 && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleVinDecode}
                                        disabled={vinDecoding}
                                        className="absolute right-1 top-1 h-8 px-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        {vinDecoding ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Search className="h-3 w-3" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mileage" className="text-foreground">Mileage</Label>
                        <Input
                            id="mileage"
                            type="number"
                            value={data.mileage || ''}
                            onChange={(e) => handleFieldChange('mileage', parseInt(e.target.value) || '')}
                            onBlur={() => handleBlur('mileage')}
                            placeholder="45000"
                            disabled={!isEditing}
                            className={`bg-white dark:bg-background text-foreground border-border focus:ring-red-600 focus:border-red-600 ${
                                errors.mileage ? 'border-red-600 dark:border-red-500 focus:border-red-600' : ''
                            }`}
                            min="0"
                        />
                        {errors.mileage && (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                {errors.mileage}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

// Export the validation function for use in parent components
export const validateWalkInVehicleInfo = (data: WalkInVehicleInfo): boolean => {
    // Only year, make, and model are required - license_plate is optional
    const requiredFields: (keyof WalkInVehicleInfo)[] = ['year', 'make', 'model']
    return requiredFields.every(field => {
        const value = data[field]
        return value && (typeof value === 'string' ? value.trim().length > 0 : true)
    })
}

export default WalkInVehicleForm