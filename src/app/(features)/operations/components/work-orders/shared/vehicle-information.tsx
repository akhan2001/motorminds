'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { VehicleDropdown } from "@/app/(features)/customers/components/Selection"
import { VehicleService } from "@/app/(features)/customers/lib/vehicle-service"
import { decodeVin } from "@/app/(features)/customers/vehicles/lib/vin-decode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, Loader2, Search } from "lucide-react"
import type { VehicleOption, VehicleFormData } from "@/app/(features)/customers/types/vehicle"
import { VEHICLE_MAKES } from "@/app/(features)/customers/types/vehicle"

export interface VehicleInformationProps {
    customerId?: string // Added to enable vehicle dropdown
    selectedVehicleId?: string // Added to track selected vehicle
    vehicleId?: string // Added to identify which vehicle to update
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleVin: string
    vehicleLicensePlate: string
    vehicleMileage: string
    isEditing: boolean
    isCreating?: boolean
    onFieldChange: (field: string, value: string) => void
    onVehicleSelect?: (vehicleId: string, vehicleData?: VehicleOption) => void // Added for vehicle selection
    onVehicleSaved?: (vehicleId: string, vehicleData: any) => void
    className?: string
    // For invoice vehicle info updates
    invoiceNumber?: string
    shopId?: string
}

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
    customerId,
    selectedVehicleId,
    vehicleId,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicleColor,
    vehicleVin,
    vehicleLicensePlate,
    vehicleMileage,
    isEditing,
    isCreating = false,
    onFieldChange,
    onVehicleSelect,
    onVehicleSaved,
    className = "",
    invoiceNumber,
    shopId
}) => {
    const [isSaving, setIsSaving] = useState(false)
    const [vinDecoding, setVinDecoding] = useState(false)
    const [isSavingNewVehicle, setIsSavingNewVehicle] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<'vehicleYear' | 'vehicleMake' | 'vehicleModel', string>>>({})

    // Normalize vehicleMake to match VEHICLE_MAKES format when component receives it
    useEffect(() => {
        if (vehicleMake && vehicleMake.trim()) {
            const foundMake = VEHICLE_MAKES.find(
                make => make.toLowerCase() === vehicleMake.toLowerCase()
            )
            if (foundMake && foundMake !== vehicleMake) {
                // Normalize to match VEHICLE_MAKES case
                onFieldChange('vehicleMake', foundMake)
            }
        }
    }, [vehicleMake, onFieldChange])

    const validateField = (field: 'vehicleYear' | 'vehicleMake' | 'vehicleModel', value: string): string | undefined => {
        switch (field) {
            case 'vehicleYear':
                if (!value || value.trim().length === 0) return 'Year is required'
                const year = parseInt(value)
                if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
                    return 'Please enter a valid year'
                }
                return undefined
            case 'vehicleMake':
                if (!value || value.trim().length === 0) return 'Make is required'
                return undefined
            case 'vehicleModel':
                if (!value || value.trim().length === 0) return 'Model is required'
                return undefined
            default:
                return undefined
        }
    }

    const handleBlur = (field: 'vehicleYear' | 'vehicleMake' | 'vehicleModel', value: string) => {
        const error = validateField(field, value)
        if (error) setErrors(prev => ({ ...prev, [field]: error }))
    }

    const isFormValid = () => {
        const yearErr = validateField('vehicleYear', vehicleYear)
        const makeErr = validateField('vehicleMake', vehicleMake)
        const modelErr = validateField('vehicleModel', vehicleModel)
        return !yearErr && !makeErr && !modelErr
    }

    // Handle saving vehicle updates
    const handleSaveVehicle = async () => {
        if (!vehicleId) {
            toast.error("No vehicle selected to update")
            return
        }

        // If this is an invoice vehicle (vehicleId === 'existing'), use invoice update function
        if (vehicleId === 'existing' && invoiceNumber && shopId) {
            setIsSaving(true)
            try {
                // Dynamically import the invoice utils to avoid circular dependency
                const { updateInvoiceVehicleInfo } = await import('@/app/invoices/utils/invoice-utils')
                
                const vehicleInfo = {
                    year: vehicleYear,
                    make: vehicleMake,
                    model: vehicleModel,
                    license_plate: vehicleLicensePlate,
                    color: vehicleColor,
                    vin: vehicleVin,
                    mileage: vehicleMileage
                }
                
                await updateInvoiceVehicleInfo(invoiceNumber, vehicleInfo, shopId)
                toast.success("Vehicle information updated successfully")
            } catch (error) {
                console.error('Error updating invoice vehicle:', error)
                toast.error("Failed to update vehicle information")
            } finally {
                setIsSaving(false)
            }
            return
        }

        // Otherwise, update the customer vehicle in the database
        setIsSaving(true)
        try {
            await VehicleService.updateVehicle(vehicleId, {
                color: vehicleColor,
                licensePlate: vehicleLicensePlate,
                mileage: vehicleMileage
            })
            toast.success("Vehicle information updated successfully")
        } catch (error) {
            console.error('Error updating vehicle:', error)
            toast.error("Failed to update vehicle information")
        } finally {
            setIsSaving(false)
        }
    }

    // Handle vehicle selection from dropdown
    const handleVehicleSelect = (vehicleId: string, vehicleData?: VehicleOption) => {
        if (vehicleId === "new") {
            // "Add New Vehicle" - clear all fields for manual input
            onFieldChange('vehicleYear', '')
            onFieldChange('vehicleMake', '')
            onFieldChange('vehicleModel', '')
            onFieldChange('vehicleColor', '')
            onFieldChange('vehicleVin', '')
            onFieldChange('vehicleLicensePlate', '')
            onFieldChange('vehicleMileage', '')
            setErrors({}) // Clear errors when starting new vehicle
            onVehicleSelect?.("new")
        } else if (vehicleData) {
            // Existing vehicle - populate data (handle null values from staging)
            onFieldChange('vehicleYear', vehicleData.year ? vehicleData.year.toString() : '')
            
            // Normalize make to match VEHICLE_MAKES format (case-insensitive matching)
            let normalizedMake = vehicleData.make || ''
            if (normalizedMake) {
                const foundMake = VEHICLE_MAKES.find(
                    make => make.toLowerCase() === normalizedMake.toLowerCase()
                )
                if (foundMake) {
                    normalizedMake = foundMake // Use the exact case from VEHICLE_MAKES
                }
            }
            onFieldChange('vehicleMake', normalizedMake)
            
            onFieldChange('vehicleModel', vehicleData.model || '')
            onFieldChange('vehicleColor', vehicleData.color || '')
            onFieldChange('vehicleVin', vehicleData.vin || '')
            onFieldChange('vehicleLicensePlate', vehicleData.licensePlate || '')
            onFieldChange('vehicleMileage', '') // Mileage not included in dropdown data
            setErrors({}) // Clear errors when selecting existing vehicle
            onVehicleSelect?.(vehicleId, vehicleData)
        }
    }

    // Handle saving new vehicle
    const handleSaveNewVehicle = async () => {
        if (!customerId || customerId === "new") {
            toast.error('Customer must be saved first before adding vehicles')
            return
        }

        // Validate all required fields
        const yearErr = validateField('vehicleYear', vehicleYear)
        const makeErr = validateField('vehicleMake', vehicleMake)
        const modelErr = validateField('vehicleModel', vehicleModel)
        setErrors(prev => ({ ...prev, vehicleYear: yearErr, vehicleMake: makeErr, vehicleModel: modelErr }))
        
        if (yearErr || makeErr || modelErr) {
            return
        }

        setIsSavingNewVehicle(true)
        try {
            const vehicleData: VehicleFormData = {
                year: vehicleYear.trim(),
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                color: vehicleColor.trim() || undefined,
                vin: vehicleVin.trim() || undefined,
                licensePlate: vehicleLicensePlate.trim() || undefined,
                mileage: vehicleMileage.trim() || undefined,
            }

            const savedVehicle = await VehicleService.createVehicle(customerId, vehicleData)
            
            toast.success(`Vehicle "${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}" created successfully`)
            
            // Notify parent component with the new vehicle data
            onVehicleSaved?.(savedVehicle.id, {
                id: savedVehicle.id,
                year: savedVehicle.year,
                make: savedVehicle.make,
                model: savedVehicle.model,
                color: savedVehicle.color,
                vin: savedVehicle.vin,
                licensePlate: savedVehicle.license_plate,
                mileage: savedVehicle.mileage
            })
            
            // Update the vehicle ID to the newly created vehicle
            onVehicleSelect?.(savedVehicle.id, VehicleService.toVehicleOption(savedVehicle))
            
        } catch (error: any) {
            console.error('Error saving vehicle:', error)
            toast.error(error.message || 'Failed to save vehicle')
        } finally {
            setIsSavingNewVehicle(false)
        }
    }

    // Handle VIN decoding
    const handleVinDecode = async () => {
        const vin = vehicleVin.trim()
        
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
                onFieldChange('vehicleYear', decodedVehicle.year || '')
                
                // Handle make with case-insensitive matching
                let matchedMake = decodedVehicle.make || ''
                if (matchedMake) {
                    // Find matching make from VEHICLE_MAKES (case-insensitive)
                    const foundMake = VEHICLE_MAKES.find(
                        make => make.toLowerCase() === matchedMake.toLowerCase()
                    )
                    if (foundMake) {
                        matchedMake = foundMake // Use the exact case from VEHICLE_MAKES
                    }
                }
                onFieldChange('vehicleMake', matchedMake)
                onFieldChange('vehicleModel', decodedVehicle.model || '')
                
                toast.success(`VIN decoded: ${decodedVehicle.year} ${matchedMake} ${decodedVehicle.model}`)
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
        <h3 className="text-lg font-medium text-foreground dark:text-white">Vehicle Information</h3>
            <div className="bg-slate-50 dark:bg-[#1A1A1A] rounded-xl p-6">
                {/* Vehicle Selection Dropdown (only for creation mode) */}
                {isCreating && isEditing && customerId && customerId !== "new" && (
                    <div className="mb-4">
                        <VehicleDropdown
                            customerId={customerId}
                            selectedVehicleId={selectedVehicleId || ""}
                            onVehicleSelect={handleVehicleSelect}
                            placeholder="Select Vehicle"
                            className="w-full"
                            isLoading={!customerId}
                        />
                    </div>
                )}
                {/* Vehicle Information Fields */}
                <div className="space-y-2 mt-2 p-3 border border-border dark:border-[#2a2a2a] rounded-md">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_year" className="text-muted-foreground dark:text-gray-400">Year *</Label>
                            <Input
                                id="vehicle_year"
                                type="number"
                                value={vehicleYear}
                                onChange={(e) => {
                                    if (!isEditing) return
                                    onFieldChange('vehicleYear', e.target.value)
                                    if (errors.vehicleYear) setErrors(prev => ({ ...prev, vehicleYear: undefined }))
                                }}
                                onBlur={() => handleBlur('vehicleYear', vehicleYear)}
                                className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500 ${errors.vehicleYear ? 'border-red-500 focus:border-red-500' : ''}`}
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                required={isCreating && (!selectedVehicleId || selectedVehicleId === "new")}
                                placeholder="2020"
                                min="1970"
                                max={new Date().getFullYear() + 1}
                            />
                            {errors.vehicleYear && (
                                <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                    {errors.vehicleYear}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_make" className="text-muted-foreground dark:text-gray-400">Make *</Label>
                            <Select
                                value={vehicleMake}
                                onValueChange={(value) => {
                                    if (!isEditing) return
                                    onFieldChange('vehicleMake', value)
                                    if (errors.vehicleMake) setErrors(prev => ({ ...prev, vehicleMake: undefined }))
                                }}
                                disabled={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                            >
                                <SelectTrigger 
                                    id="vehicle_make"
                                    className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500 ${errors.vehicleMake ? 'border-red-500 focus:border-red-500' : ''}`}
                                >
                                    <SelectValue placeholder="Select make" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                    {VEHICLE_MAKES.map((make) => (
                                        <SelectItem key={make} value={make} className="text-popover-foreground dark:text-white hover:bg-accent dark:hover:bg-[#2a2a2a]">
                                            {make}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.vehicleMake && (
                                <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                    {errors.vehicleMake}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_model" className="text-muted-foreground dark:text-gray-400">Model *</Label>
                            <Input
                                id="vehicle_model"
                                value={vehicleModel}
                                onChange={(e) => {
                                    if (!isEditing) return
                                    onFieldChange('vehicleModel', e.target.value)
                                    if (errors.vehicleModel) setErrors(prev => ({ ...prev, vehicleModel: undefined }))
                                }}
                                onBlur={() => handleBlur('vehicleModel', vehicleModel)}
                                className={`bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500 ${errors.vehicleModel ? 'border-red-500 focus:border-red-500' : ''}`}
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                required={isCreating && (!selectedVehicleId || selectedVehicleId === "new")}
                                placeholder="e.g. Civic"
                            />
                            {errors.vehicleModel && (
                                <div className="mt-1 text-red-500 dark:text-red-400 text-xs flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7h2v6h-2zm0 8h2v2h-2z"/></svg>
                                    {errors.vehicleModel}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">Color</Label>
                            <Input
                                value={vehicleColor}
                                onChange={(e) => isEditing && onFieldChange('vehicleColor', e.target.value)}
                                className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="e.g. Blue"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400 flex items-center gap-2">
                                VIN
                            </Label>
                            <div className="relative">
                                <Input
                                    value={vehicleVin}
                                    onChange={(e) => isEditing && onFieldChange('vehicleVin', e.target.value.toUpperCase())}
                                    className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500 pr-20"
                                    readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                    placeholder="17-character VIN"
                                    maxLength={17}
                                />
                                {/* VIN Decoder - Only show when creating new vehicle */}
                                {isEditing && isCreating && (!selectedVehicleId || selectedVehicleId === "new") && vehicleVin && vehicleVin.length === 17 && (
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
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">License Plate</Label>
                            <Input
                                value={vehicleLicensePlate}
                                onChange={(e) => isEditing && onFieldChange('vehicleLicensePlate', e.target.value.toUpperCase())}
                                className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="ABC123"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground dark:text-gray-400">Mileage</Label>
                            <Input
                                value={vehicleMileage}
                                onChange={(e) => isEditing && onFieldChange('vehicleMileage', e.target.value)}
                                className="bg-background dark:bg-[#1a1a1a] text-foreground dark:text-white border-border dark:border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing}
                                placeholder="Current mileage"
                                type="number"
                            />
                        </div>
                    </div>
                    
                    {/* Save New Vehicle Button - Only show when creating new vehicle */}
                    {isCreating && isEditing && (!selectedVehicleId || selectedVehicleId === "new") && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                onClick={handleSaveNewVehicle}
                                disabled={isSavingNewVehicle || !isFormValid() || !customerId || customerId === "new"}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                            >
                                {isSavingNewVehicle ? (
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
                    )}
                </div>

                {/* Save Button - Only show in edit mode when not creating */}
                {isEditing && !isCreating && vehicleId && (
                    <div className="mt-4 flex justify-end">
                        <Button
                            onClick={handleSaveVehicle}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Vehicle Info
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
