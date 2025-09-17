'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface VehicleInformationProps {
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleVin: string
    vehicleLicensePlate: string
    vehicleMileage: string
    isEditing: boolean
    onFieldChange: (field: string, value: string) => void
    className?: string
}

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicleColor,
    vehicleVin,
    vehicleLicensePlate,
    vehicleMileage,
    isEditing,
    onFieldChange,
    className = ""
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-medium text-white">Vehicle Information</h3>
            <div className="bg-[#1A1A1A] rounded-xl p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Year</Label>
                        <Input
                            value={vehicleYear}
                            onChange={(e) => isEditing && onFieldChange('vehicleYear', e.target.value)}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Make</Label>
                        <Input
                            value={vehicleMake}
                            onChange={(e) => isEditing && onFieldChange('vehicleMake', e.target.value)}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Model</Label>
                        <Input
                            value={vehicleModel}
                            onChange={(e) => isEditing && onFieldChange('vehicleModel', e.target.value)}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Color</Label>
                        <Input
                            value={vehicleColor}
                            onChange={(e) => isEditing && onFieldChange('vehicleColor', e.target.value)}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
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
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">License Plate</Label>
                        <Input
                            value={vehicleLicensePlate}
                            onChange={(e) => isEditing && onFieldChange('vehicleLicensePlate', e.target.value.toUpperCase())}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-400">Mileage</Label>
                        <Input
                            value={vehicleMileage}
                            onChange={(e) => isEditing && onFieldChange('vehicleMileage', e.target.value)}
                            className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                            readOnly={!isEditing}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
