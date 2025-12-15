'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Car, ChevronDown } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface SandboxVehicle {
	id?: number
	motorId?: number
	year: number
	make: string
	model: string
	baseVehicleId?: number
	vin?: string
	plate?: string
	customerName?: string
	activeDTCCodes?: string[]
}

interface VehicleSelectorProps {
	selectedVehicle: SandboxVehicle | null
	onVehicleSelect: (vehicle: SandboxVehicle) => void
}

// Mock vehicles for now - replace with actual data fetching
const mockVehicles: SandboxVehicle[] = [
	{
		id: 1,
		motorId: 1,
		year: 2010,
		make: 'Honda',
		model: 'Civic',
		baseVehicleId: 22124,
		plate: 'ABC-1234',
		customerName: 'Michael Rodriguez',
		activeDTCCodes: ['P0171', 'P0174']
	},
	{
		id: 2,
		motorId: 2,
		year: 2012,
		make: 'Ford',
		model: 'F-150',
		baseVehicleId: 22125,
		plate: 'XYZ-5678',
		customerName: 'John Smith',
		activeDTCCodes: ['P0420']
	}
]

export default function VehicleSelector({
	selectedVehicle,
	onVehicleSelect
}: VehicleSelectorProps) {
	const displayVehicle = selectedVehicle || mockVehicles[0]

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-2 h-9 px-3 text-sm"
				>
					<Car className="w-4 h-4" />
					<span className="font-medium">
						{displayVehicle.year} {displayVehicle.make} {displayVehicle.model}
					</span>
					<ChevronDown className="w-4 h-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-64">
				{mockVehicles.map((vehicle) => (
					<DropdownMenuItem
						key={vehicle.id}
						onClick={() => onVehicleSelect(vehicle)}
						className="flex flex-col items-start gap-1 py-2"
					>
						<div className="font-medium">
							{vehicle.year} {vehicle.make} {vehicle.model}
						</div>
						<div className="text-xs text-muted-foreground">
							{vehicle.plate || vehicle.vin?.slice(-8) || 'No plate/VIN'}
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

