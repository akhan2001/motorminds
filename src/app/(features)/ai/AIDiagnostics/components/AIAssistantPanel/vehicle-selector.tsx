"use client"

import { Car } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { MotorVehicle } from '@/lib/integrations/motor-daas/types'

interface VehicleSelectorProps {
    vehicles: MotorVehicle[]
    selectedVehicleId: number | null
    onVehicleSelect: (vehicleId: number) => void
}

/**
 * Vehicle Selector Component
 * 
 * Dropdown selector for choosing a vehicle from the MOTOR DaaS test vehicles.
 * Displays vehicle year, make, and model for easy identification.
 * 
 * @component
 */
export function VehicleSelector({
    vehicles,
    selectedVehicleId,
    onVehicleSelect
}: VehicleSelectorProps) {
    return (
        <div className="p-4 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-gray-400" />
                <label className="text-xs text-gray-400 font-medium">
                    Select Vehicle
                </label>
            </div>
            <Select
                value={selectedVehicleId?.toString() || ''}
                onValueChange={(value) => onVehicleSelect(parseInt(value))}
            >
                <SelectTrigger className="w-full bg-[#111111] border-[#2a2a2a] text-white">
                    <SelectValue placeholder="Choose a vehicle..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111111] border-[#2a2a2a] text-white">
                    {vehicles.map((vehicle) => (
                        <SelectItem
                            key={vehicle.motorVehicleId}
                            value={vehicle.motorVehicleId.toString()}
                            className="
                                text-white
                                hover:bg-[#1f1f1f] hover:text-white
                                focus:bg-[#1f1f1f] focus:text-white
                                data-[highlighted]:bg-[#1f1f1f] data-[highlighted]:text-white
                                data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:text-white
                                cursor-pointer
                            "
                        >
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedVehicleId && (
                <div className="mt-2 text-xs text-gray-500">
                    VIN: {vehicles.find(v => v.motorVehicleId === selectedVehicleId)?.vin}
                </div>
            )}
        </div>
    )
}

