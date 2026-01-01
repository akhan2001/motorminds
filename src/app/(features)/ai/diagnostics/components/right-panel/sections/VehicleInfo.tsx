'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Gauge, User, Phone } from 'lucide-react'

interface VehicleInfoProps {
	vehicle: {
		year?: number
		make?: string
		model?: string
		plate?: string
		vin?: string
		mileage?: number
		customerName?: string
		customerPhone?: string
		baseVehicleId?: number
		engineId?: number
	} | null
}

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
	if (!vehicle) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base flex items-center gap-2">
						<Car className="w-4 h-4" />
						Vehicle Information
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">No vehicle information available</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center gap-2">
					<Car className="w-4 h-4" />
					Vehicle Information
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{/* Vehicle Details */}
				<div>
					<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
						{vehicle.year} {vehicle.make} {vehicle.model}
					</h4>
					<div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
						{vehicle.plate && (
							<div className="flex items-center gap-2">
								<span className="font-medium">Plate:</span>
								<span>{vehicle.plate}</span>
							</div>
						)}
						{vehicle.vin && (
							<div className="flex items-center gap-2">
								<span className="font-medium">VIN:</span>
								<span className="font-mono">{vehicle.vin}</span>
							</div>
						)}
						{vehicle.mileage !== undefined && (
							<div className="flex items-center gap-2">
								<Gauge className="w-3.5 h-3.5" />
								<span>{vehicle.mileage.toLocaleString()} miles</span>
							</div>
						)}
					</div>
				</div>

				{/* Customer Info */}
				{(vehicle.customerName || vehicle.customerPhone) && (
					<div className="pt-2 border-t border-border">
						<h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
							Customer
						</h5>
						<div className="space-y-1 text-xs text-muted-foreground">
							{vehicle.customerName && (
								<div className="flex items-center gap-2">
									<User className="w-3.5 h-3.5" />
									<span>{vehicle.customerName}</span>
								</div>
							)}
							{vehicle.customerPhone && (
								<div className="flex items-center gap-2">
									<Phone className="w-3.5 h-3.5" />
									<span>{vehicle.customerPhone}</span>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Technical Info */}
				{(vehicle.baseVehicleId || vehicle.engineId) && (
					<div className="pt-2 border-t border-border">
						<h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
							Technical
						</h5>
						<div className="space-y-1 text-xs text-muted-foreground font-mono">
							{vehicle.baseVehicleId && (
								<div>Base Vehicle ID: {vehicle.baseVehicleId}</div>
							)}
							{vehicle.engineId && (
								<div>Engine ID: {vehicle.engineId}</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

