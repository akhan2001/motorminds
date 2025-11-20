'use client'

import React, { useState } from 'react'
import { Car, User, Phone, Gauge, ChevronDown, ChevronUp } from 'lucide-react'

interface VehicleInfoProps {
	vehicle: any
}

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
	const [isExpanded, setIsExpanded] = useState(true)

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<Car className="w-4 h-4 text-red-600 dark:text-red-500" />
					Vehicle Overview
				</h3>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				)}
			</button>

			{isExpanded && (
				<div className="px-4 pb-4 pt-1">
					<div className="space-y-2.5 text-sm">
						<div>
							<div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Vehicle</div>
							<div className="font-medium text-gray-900 dark:text-white">
								{vehicle.year} {vehicle.make} {vehicle.model}
							</div>
							{vehicle.trim && (
								<div className="text-xs text-gray-600 dark:text-gray-400">{vehicle.trim}</div>
							)}
						</div>

					<div className="grid grid-cols-2 gap-2">
						<div>
							<div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">VIN</div>
							<div className="text-xs font-mono text-gray-900 dark:text-white">
								{vehicle.vin || 'N/A'}
							</div>
						</div>
						{vehicle.plate && (
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Plate</div>
								<div className="text-xs font-medium text-gray-900 dark:text-white">
									{vehicle.plate}
								</div>
							</div>
						)}
					</div>

					{vehicle.mileage && (
						<div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
							<Gauge className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
							<div>
								<span className="text-xs text-gray-500 dark:text-gray-400">Mileage: </span>
								<span className="text-xs font-medium text-gray-900 dark:text-white">
									{vehicle.mileage.toLocaleString()} mi
								</span>
							</div>
						</div>
					)}

					{(vehicle.customerName || vehicle.customerPhone) && (
						<div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
							{vehicle.customerName && (
								<div className="flex items-center gap-2 mb-1">
									<User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
									<span className="text-xs font-medium text-gray-900 dark:text-white">
										{vehicle.customerName}
									</span>
								</div>
							)}
							{vehicle.customerPhone && (
								<div className="flex items-center gap-2 ml-5">
									<Phone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
									<span className="text-xs text-gray-600 dark:text-gray-400">
										{vehicle.customerPhone}
									</span>
								</div>
							)}
						</div>
					)}
					</div>
				</div>
			)}
		</div>
	)
}
