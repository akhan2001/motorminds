'use client'

import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ControllerRenderProps } from 'react-hook-form'
import { CustomerVehicle } from '@/hooks/useShopMeta'

interface VehiclePickerProps {
    field: ControllerRenderProps<any, 'vehicleId'>
    vehicles: CustomerVehicle[]
}

const VehiclePickerMemo = ({ field, vehicles }: VehiclePickerProps) => {
    return (
        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={vehicles.length === 0}>
            <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
                {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export const VehiclePicker = memo(VehiclePickerMemo) 