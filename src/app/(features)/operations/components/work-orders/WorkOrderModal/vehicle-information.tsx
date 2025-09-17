'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VehicleDropdown } from "@/app/(features)/customers/components/Selection"
import type { VehicleOption } from "@/app/(features)/customers/types/vehicle"

export interface VehicleInformationProps {
    customerId?: string // Added to enable vehicle dropdown
    selectedVehicleId?: string // Added to track selected vehicle
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
    className?: string
}

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
    customerId,
    selectedVehicleId,
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
    className = ""
}) => {
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
    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    vehicleMake && vehicleModel && vehicleYear ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                    {vehicleMake && vehicleModel && vehicleYear ? '✓' : '2'}
                </div>
                <h3 className={`text-lg font-semibold ${vehicleMake && vehicleModel && vehicleYear ? 'text-green-400' : 'text-white'}`}>
                    Vehicle Information
                </h3>
            </div>
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
                <div className="space-y-2 mt-2 p-3 border border-[#626262] rounded-md">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Year</Label>
                            <Input
                                value={vehicleYear}
                                onChange={(e) => isEditing && onFieldChange('vehicleYear', e.target.value)}
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
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
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
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
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
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
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="e.g. Blue"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">VIN</Label>
                            <Input
                                value={vehicleVin}
                                onChange={(e) => isEditing && onFieldChange('vehicleVin', e.target.value)}
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="17-character VIN"
                                maxLength={17}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">License Plate</Label>
                            <Input
                                value={vehicleLicensePlate}
                                onChange={(e) => isEditing && onFieldChange('vehicleLicensePlate', e.target.value.toUpperCase())}
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                readOnly={!isEditing || (isCreating && !!selectedVehicleId && selectedVehicleId !== "new")}
                                placeholder="ABC123"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-400">Mileage</Label>
                            <Input
                                value={vehicleMileage}
                                onChange={(e) => isEditing && onFieldChange('vehicleMileage', e.target.value)}
                                className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                readOnly={!isEditing}
                                placeholder="Current mileage"
                                type="number"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
