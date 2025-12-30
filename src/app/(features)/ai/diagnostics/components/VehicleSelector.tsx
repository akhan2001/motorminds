'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, ChevronDown, Search, X } from 'lucide-react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MOTOR_SANDBOX_VEHICLES } from '../data/motorSandboxVehicles'

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

export default function VehicleSelector({
	selectedVehicle,
	onVehicleSelect
}: VehicleSelectorProps) {
	const [searchQuery, setSearchQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)

	// Default to first vehicle if none selected
	const displayVehicle = selectedVehicle || MOTOR_SANDBOX_VEHICLES[0]

	// Filter vehicles based on search query
	const filteredVehicles = useMemo(() => {
		if (!searchQuery.trim()) {
			return MOTOR_SANDBOX_VEHICLES
		}

		const query = searchQuery.toLowerCase().trim()
		return MOTOR_SANDBOX_VEHICLES.filter((vehicle) => {
			const yearStr = vehicle.year.toString()
			const make = vehicle.make.toLowerCase()
			const model = vehicle.model.toLowerCase()
			const vin = vehicle.vin?.toLowerCase() || ''
			const vinLast8 = vehicle.vin?.slice(-8).toLowerCase() || ''

			return (
				yearStr.includes(query) ||
				make.includes(query) ||
				model.includes(query) ||
				vin.includes(query) ||
				vinLast8.includes(query)
			)
		})
	}, [searchQuery])

	const handleVehicleSelect = (vehicle: SandboxVehicle) => {
		onVehicleSelect(vehicle)
		setIsOpen(false)
		setSearchQuery('')
	}

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open)
		if (!open) {
			setSearchQuery('')
		}
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="flex items-center gap-1.5 md:gap-2 h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm"
				>
					<Car className="w-3.5 h-3.5 md:w-4 md:h-4" />
					<span className="font-medium truncate max-w-[120px] md:max-w-none">
						{displayVehicle.year} {displayVehicle.make} {displayVehicle.model}
					</span>
					<ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-50 flex-shrink-0" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[280px] md:w-80 p-0">
				{/* Search Input */}
				<div className="p-2 border-b border-gray-200 dark:border-gray-700">
					<div className="relative">
						<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							type="text"
							placeholder="Search by make, model, year, or VIN..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-8 pr-8 h-9 text-sm"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => {
								e.stopPropagation()
								if (e.key === 'Escape') {
									setSearchQuery('')
								}
							}}
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									setSearchQuery('')
								}}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				{/* Vehicle List */}
				<div className="max-h-[300px] overflow-y-auto">
					{filteredVehicles.length > 0 ? (
						filteredVehicles.map((vehicle) => (
							<DropdownMenuItem
								key={vehicle.motorId}
								onClick={() => handleVehicleSelect(vehicle)}
								className="flex flex-col items-start gap-1 py-2.5 px-3 cursor-pointer focus:bg-gray-100 dark:focus:bg-gray-800"
							>
								<div className="font-medium text-sm w-full">
									{vehicle.year} {vehicle.make} {vehicle.model}
								</div>
								<div className="flex items-center gap-3 text-xs text-muted-foreground w-full">
									<span>VIN: {vehicle.vin?.slice(-8)}</span>
									<span className="text-gray-400">•</span>
									<span>MOTOR ID: {vehicle.motorId}</span>
								</div>
							</DropdownMenuItem>
						))
					) : (
						<div className="py-6 px-3 text-center">
							<p className="text-sm text-muted-foreground">
								No vehicles found matching "{searchQuery}"
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								Try a different search term
							</p>
						</div>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

