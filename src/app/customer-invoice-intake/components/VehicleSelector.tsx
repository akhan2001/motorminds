'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

interface VehicleSelectorProps {
    customerId: string | null
    onVehicleSelect: (vehicleId: string, vehicleData?: any) => void
    selectedVehicle: any
}

export default function VehicleSelector({ customerId, onVehicleSelect, selectedVehicle }: VehicleSelectorProps) {
    const [customerVehicles, setCustomerVehicles] = useState<any[]>([])

    useEffect(() => {
        async function fetchVehicles() {
            if (!customerId) {
                setCustomerVehicles([])
                return
            }
            
            try {
                const { data: vehicles, error } = await supabase
                    .from('customer_vehicles')
                    .select('*')
                    .eq('customer_id', customerId)
                    .order('created_at', { ascending: false })
                
                if (error) {
                    console.error("Error fetching customer vehicles:", error)
                    setCustomerVehicles([])
                    return
                }
                
                setCustomerVehicles(vehicles || [])
            } catch (error) {
                console.error('Error fetching vehicles:', error)
                setCustomerVehicles([])
            }
        }
        
        fetchVehicles()
    }, [customerId])

    const handleVehicleChange = (vehicleId: string) => {
        if (vehicleId === 'new') {
            onVehicleSelect('new', null)
        } else {
            const vehicle = customerVehicles.find(v => v.id === vehicleId)
            onVehicleSelect(vehicleId, vehicle)
        }
    }

    if (!customerId) {
        return null
    }

    return (
        <div className="mt-4">
            <label className="text-gray-300 mb-2 block">Select Vehicle</label>
            <Select onValueChange={handleVehicleChange}>
                <SelectTrigger className="bg-[#131313] border-[#222] text-white focus:ring-1 focus:ring-[#b22222] focus:border-[#b22222]">
                    <SelectValue placeholder="Choose a vehicle or add a new one" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#222] text-white">
                    {customerVehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate || 'No plate'}
                        </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-[#b22222]">+ Add New Vehicle</SelectItem>
                </SelectContent>
            </Select>
            
            <p className="text-xs text-gray-400 mt-2">
                {customerVehicles.length > 0 
                    ? "Select a vehicle or add a new one." 
                    : "This customer has no vehicles. Please add one."
                }
            </p>
        </div>
    )
} 