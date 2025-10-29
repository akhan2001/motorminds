'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { decodeVin } from '@/app/(features)/customers/vehicles/lib/vin-decode'
import type { WalkInVehicleInfo } from '../../../../customers/types/vehicle'

interface WalkInVehicleFormProps {
    data: WalkInVehicleInfo
    onDataChange: (data: WalkInVehicleInfo) => void
    isEditing?: boolean
    className?: string
}

export const WalkInVehicleForm: React.FC<WalkInVehicleFormProps> = ({
    data,
    onDataChange,
    isEditing = true,
    className = ""
}) => {
    const [errors, setErrors] = useState<Partial<Record<keyof WalkInVehicleInfo, string>>>({})
    const [vinDecoding, setVinDecoding] = useState(false)

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
            if (['year', 'make', 'model', 'license_plate'].includes(field as string)) {
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
            case 'license_plate':
                if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                    return 'License plate is required'
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
        const requiredFields: (keyof WalkInVehicleInfo)[] = ['year', 'make', 'model', 'license_plate']
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
            
            if (decodedVehicle) {
                // Populate fields with decoded data
                handleFieldChange('year', decodedVehicle.year || '')
                handleFieldChange('make', decodedVehicle.make || '')
                handleFieldChange('model', decodedVehicle.model || '')
                
                toast.success(`VIN decoded: ${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`)
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

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Walk-in Vehicle Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="year" className="text-gray-400">Year *</Label>
                            <Input
                                id="year"
                                type="number"
                                value={data.year || ''}
                                onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || '')}
                                onBlur={() => handleBlur('year')}
                                placeholder="2020"
                                disabled={!isEditing}
                                className={`bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 ${
                                    errors.year ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                                min="1900"
                                max={new Date().getFullYear() + 1}
                            />
                            {errors.year && (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.year}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="make" className="text-gray-400">Make *</Label>
                            <Input
                                id="make"
                                value={data.make || ''}
                                onChange={(e) => handleFieldChange('make', e.target.value)}
                                onBlur={() => handleBlur('make')}
                                placeholder="Toyota"
                                disabled={!isEditing}
                                className={`bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 ${
                                    errors.make ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                            />
                            {errors.make && (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.make}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="model" className="text-gray-400">Model *</Label>
                            <Input
                                id="model"
                                value={data.model || ''}
                                onChange={(e) => handleFieldChange('model', e.target.value)}
                                onBlur={() => handleBlur('model')}
                                placeholder="Camry"
                                disabled={!isEditing}
                                className={`bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 ${
                                    errors.model ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                            />
                            {errors.model && (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.model}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="license_plate" className="text-gray-400">License Plate *</Label>
                            <Input
                                id="license_plate"
                                value={data.license_plate || ''}
                                onChange={(e) => handleFieldChange('license_plate', e.target.value.toUpperCase())}
                                onBlur={() => handleBlur('license_plate')}
                                placeholder="ABC123"
                                disabled={!isEditing}
                                className={`bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 ${
                                    errors.license_plate ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                                maxLength={10}
                            />
                            {errors.license_plate && (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.license_plate}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="color" className="text-gray-400">Color</Label>
                            <Input
                                id="color"
                                value={data.color || ''}
                                onChange={(e) => handleFieldChange('color', e.target.value)}
                                placeholder="Silver"
                                disabled={!isEditing}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vin" className="text-gray-400">VIN</Label>
                            <div className="relative">
                                <Input
                                    id="vin"
                                    value={data.vin || ''}
                                    onChange={(e) => handleFieldChange('vin', e.target.value.toUpperCase())}
                                    placeholder="1HGBH41JXMN109186"
                                    disabled={!isEditing}
                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 pr-20"
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
                                        className="absolute right-1 top-1 h-8 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
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
                        <Label htmlFor="mileage" className="text-gray-400">Mileage</Label>
                        <Input
                            id="mileage"
                            type="number"
                            value={data.mileage || ''}
                            onChange={(e) => handleFieldChange('mileage', parseInt(e.target.value) || '')}
                            onBlur={() => handleBlur('mileage')}
                            placeholder="45000"
                            disabled={!isEditing}
                            className={`bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 ${
                                errors.mileage ? 'border-red-500 focus:border-red-500' : ''
                            }`}
                            min="0"
                        />
                        {errors.mileage && (
                            <div className="flex items-center gap-1 text-red-400 text-xs">
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
    const requiredFields: (keyof WalkInVehicleInfo)[] = ['year', 'make', 'model', 'license_plate']
    return requiredFields.every(field => {
        const value = data[field]
        return value && (typeof value === 'string' ? value.trim().length > 0 : true)
    })
}

export default WalkInVehicleForm