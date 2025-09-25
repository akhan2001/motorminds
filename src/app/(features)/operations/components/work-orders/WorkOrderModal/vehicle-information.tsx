'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { VehicleDropdown } from "@/app/(features)/customers/components/Selection"
import { VehicleService } from "@/app/(features)/customers/lib/vehicle-service"
import { decodeVin } from "@/app/(features)/customers/vehicles/lib/vin-decode"
import { toast } from "sonner"
import { Save, Loader2, Search } from "lucide-react"
import type { VehicleOption, VehicleFormData } from "@/app/(features)/customers/types/vehicle"

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
    className = ""
}) => {
    const [isSaving, setIsSaving] = useState(false)
    const [vinDecoding, setVinDecoding] = useState(false)
    const [isSavingNewVehicle, setIsSavingNewVehicle] = useState(false)

    // Handle saving vehicle updates
    const handleSaveVehicle = async () => {
        if (!vehicleId) {
            toast.error("No vehicle selected to update")
            return
        }

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
            onVehicleSelect?.("new")
        } else if (vehicleData) {
            // Existing vehicle - populate data
            onFieldChange('vehicleYear', vehicleData.year.toString())
            onFieldChange('vehicleMake', vehicleData.make)
            onFieldChange('vehicleModel', vehicleData.model)
            onFieldChange('vehicleColor', vehicleData.color || '')
            onFieldChange('vehicleVin', vehicleData.vin || '')
            onFieldChange('vehicleLicensePlate', vehicleData.licensePlate || '')
            onFieldChange('vehicleMileage', '') // Mileage not included in dropdown data
            onVehicleSelect?.(vehicleId, vehicleData)
        }
    }

    // Handle saving new vehicle
    const handleSaveNewVehicle = async () => {
        if (!customerId || customerId === "new") {
            toast.error('Customer must be saved first before adding vehicles')
            return
        }

        if (!vehicleYear.trim()) {
            toast.error('Vehicle year is required')
            return
        }

        if (!vehicleMake.trim()) {
            toast.error('Vehicle make is required')
            return
        }

        if (!vehicleModel.trim()) {
            toast.error('Vehicle model is required')
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
                onFieldChange('vehicleMake', decodedVehicle.make || '')
                onFieldChange('vehicleModel', decodedVehicle.model || '')
                
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
        <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
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
                <div className="space-y-2 mt-2 p-3 border border-[#2a2a2a] rounded-md">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Year</Label>
                            <Input
                                value={vehicleYear}
                                onChange={(e) => isEditing && onFieldChange('vehicleYear', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                required={isCreating && (!selectedVehicleId || selectedVehicleId === "new")}
                                placeholder="e.g. 2020"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Make</Label>
                            <Input
                                value={vehicleMake}
                                onChange={(e) => isEditing && onFieldChange('vehicleMake', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                required={isCreating && (!selectedVehicleId || selectedVehicleId === "new")}
                                placeholder="e.g. Honda"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Model</Label>
                            <Input
                                value={vehicleModel}
                                onChange={(e) => isEditing && onFieldChange('vehicleModel', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                required={isCreating && (!selectedVehicleId || selectedVehicleId === "new")}
                                placeholder="e.g. Civic"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Color</Label>
                            <Input
                                value={vehicleColor}
                                onChange={(e) => isEditing && onFieldChange('vehicleColor', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="e.g. Blue"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400 flex items-center gap-2">
                                VIN
                            </Label>
                            <div className="relative">
                                <Input
                                    value={vehicleVin}
                                    onChange={(e) => isEditing && onFieldChange('vehicleVin', e.target.value.toUpperCase())}
                                    className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500 pr-20"
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
                            <Label className="text-gray-400">License Plate</Label>
                            <Input
                                value={vehicleLicensePlate}
                                onChange={(e) => isEditing && onFieldChange('vehicleLicensePlate', e.target.value.toUpperCase())}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="ABC123"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Mileage</Label>
                            <Input
                                value={vehicleMileage}
                                onChange={(e) => isEditing && onFieldChange('vehicleMileage', e.target.value)}
                                className="bg-[#1a1a1a] text-white border-[#2a2a2a] focus:ring-gray-500"
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
                                disabled={isSavingNewVehicle || !vehicleYear.trim() || !vehicleMake.trim() || !vehicleModel.trim() || !customerId || customerId === "new"}
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
