'use client'

import React, { useState } from 'react'
import { ClipboardList, User, DollarSign, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

interface WorkOrdersListProps {
	workOrders: any[]
}

export function WorkOrdersList({ workOrders }: WorkOrdersListProps) {
	const [isExpanded, setIsExpanded] = useState(true)

	if (!workOrders || workOrders.length === 0) {
		return (
			<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
				>
					<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
						<ClipboardList className="w-4 h-4 text-red-600 dark:text-red-500" />
						Active Work Orders
					</h3>
					{isExpanded ? (
						<ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
					) : (
						<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
					)}
				</button>
				{isExpanded && (
					<div className="px-4 pb-4">
						<p className="text-xs text-gray-500 dark:text-gray-400">
							No active work orders for this vehicle
						</p>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<ClipboardList className="w-4 h-4 text-red-600 dark:text-red-500" />
					Active Work Orders ({workOrders.length})
				</h3>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				)}
			</button>

			{isExpanded && (
				<div className="px-4 pb-4 pt-1">
					<div className="space-y-2">
						{workOrders.map((wo) => (
							<button
								key={wo.id}
								className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-red-300 dark:hover:border-red-800 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors group"
							>
								<div className="flex items-start justify-between mb-1.5">
									<div className="text-xs font-semibold text-gray-900 dark:text-white">
										{wo.number}
									</div>
									<ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500" />
								</div>
								
								<div className="space-y-1">
									<div className="flex items-center gap-1.5">
										<span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
											wo.status === 'In Progress'
												? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
												: wo.status === 'Pending Parts'
												? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
										}`}>
											{wo.status}
										</span>
										<span className="text-xs text-gray-500 dark:text-gray-400">
											{new Date(wo.createdDate).toLocaleDateString()}
										</span>
									</div>

									{wo.assignedTechnician && (
										<div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
											<User className="w-3 h-3" />
											<span>{wo.assignedTechnician}</span>
										</div>
									)}

									<div className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-white">
										<DollarSign className="w-3 h-3" />
										<span>${wo.totalAmount.toFixed(2)}</span>
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
