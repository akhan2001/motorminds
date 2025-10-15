'use client'

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VehicleService } from "../../lib/vehicle-service"
import type { VehicleOption, VehicleDropdownProps } from "../../types/vehicle"

export const VehicleDropdown: React.FC<VehicleDropdownProps> = ({
    customerId,
    selectedVehicleId,
    onVehicleSelect,
    placeholder = "Select Vehicle",
    disabled = false,
    className = "",
    isLoading: externalLoading = false,
    refreshTrigger
}) => {
    const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([])
    const [internalLoading, setInternalLoading] = useState(false)
    
    // Combine external and internal loading states
    const isLoading = externalLoading || internalLoading

    // Fetch vehicles when customerId or refreshTrigger changes
    useEffect(() => {
        async function fetchVehicles() {
            if (!customerId || customerId === "new") {
                setVehicleOptions([])
                return
            }
            
            setInternalLoading(true)
            try {
                const vehicles = await VehicleService.getCustomerVehicles(customerId)
                const options: VehicleOption[] = vehicles.map(vehicle => 
                    VehicleService.toVehicleOption(vehicle)
                )
                setVehicleOptions(options)
            } catch (error) {
                console.error("Error fetching vehicles:", error)
                setVehicleOptions([])
            } finally {
                setInternalLoading(false)
            }
        }

        fetchVehicles()
    }, [customerId, refreshTrigger])

    // Handle vehicle selection
    const handleVehicleChange = (value: string) => {
        if (value === "new") {
            onVehicleSelect("new")
        } else {
            const selectedVehicle = vehicleOptions.find((opt) => opt.id === value)
            onVehicleSelect(value, selectedVehicle)
        }
    }

    // Dynamic placeholder based on loading state and customer selection
    const getPlaceholder = () => {
        if (!customerId || customerId === "new") return "Select customer first"
        if (externalLoading) return "Loading..."
        if (internalLoading) return "Loading vehicles..."
        if (vehicleOptions.length === 0) return "No vehicles found"
        return placeholder
    }

    // Show disabled state when no customer is selected
    const isDisabled = disabled || isLoading || !customerId || customerId === "new"

    return (
        <Select
            value={selectedVehicleId}
            onValueChange={handleVehicleChange}
            disabled={isDisabled}
        >
            <SelectTrigger className={`bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 ${className}`}>
                <SelectValue placeholder={getPlaceholder()} />
            </SelectTrigger>
            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                {!isLoading && customerId && customerId !== "new" && (
                    <>
                        <SelectItem value="new">+ Add New Vehicle</SelectItem>
                        {vehicleOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                <div className="flex flex-col">
                                    <span>{option.displayName}</span>
                                    {option.color && (
                                        <span className="text-gray-400 text-xs">{option.color}</span>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </>
                )}
                {isLoading && (
                    <SelectItem value="loading" disabled>
                        Loading vehicles...
                    </SelectItem>
                )}
                {!isLoading && (!customerId || customerId === "new") && (
                    <SelectItem value="no-customer" disabled>
                        Select a customer first
                    </SelectItem>
                )}
            </SelectContent>
        </Select>
    )
}

export default VehicleDropdown
