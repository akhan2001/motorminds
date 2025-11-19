'use client'

import React from 'react'
import { AIDiagnosticsPanel } from '@/app/(features)/ai/AIDiagnostics/components'
import { Car, Calendar, User } from 'lucide-react'

interface ChatAreaProps {
	vehicle: any
	workOrder: any
	shopId?: string
}

export function ChatArea({ vehicle, workOrder, shopId }: ChatAreaProps) {
	return (
		<div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
			{/* Chat Header */}
			<div className="flex-shrink-0 border-b border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div>
							<h1 className="text-lg font-semibold text-gray-900 dark:text-white">
								{vehicle.year} {vehicle.make} {vehicle.model}
							</h1>
							<div className="flex items-center gap-4 mt-1">
								<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
									<Car className="w-3.5 h-3.5" />
									<span>{vehicle.plate}</span>
								</div>
								{workOrder && (
									<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
										<Calendar className="w-3.5 h-3.5" />
										<span>WO #{workOrder.number}</span>
									</div>
								)}
								<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
									<User className="w-3.5 h-3.5" />
									<span>{vehicle.customerName}</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<span className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
							Active
						</span>
					</div>
				</div>
			</div>

			{/* Chat Panel */}
			<div className="flex-1 min-h-0">
				<AIDiagnosticsPanel
					workOrderId={workOrder?.id}
					vehicleId={vehicle.id}
					baseVehicleId={vehicle.baseVehicleId}
					dtcCodes={vehicle.activeDTCCodes}
					reportedIssue={workOrder?.reportedIssue}
					className="h-full"
				/>
			</div>
		</div>
	)
}

