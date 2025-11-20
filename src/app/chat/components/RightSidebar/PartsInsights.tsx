'use client'

import React, { useState } from 'react'
import { Package, TrendingUp, Clock, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { PartsOrderingSheet } from '@/app/chat/components/Parts/PartsOrderingSheet'

interface PartsInsightsProps {
	parts: any[]
}

export function PartsInsights({ parts }: PartsInsightsProps) {
	const [isExpanded, setIsExpanded] = useState(true)
	const [isOrderingSheetOpen, setIsOrderingSheetOpen] = useState(false)
	const [selectedParts, setSelectedParts] = useState<any[]>([])

	if (!parts || parts.length === 0) {
		return null
	}

	const handleOrderClick = (part: any) => {
		setSelectedParts([part])
		setIsOrderingSheetOpen(true)
		console.log('Ordering part:', part)
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<Package className="w-4 h-4 text-red-600 dark:text-red-500" />
					Parts Insights
				</h3>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				)}
			</button>

			{isExpanded && (
				<div className="px-4 pb-4 pt-1">
					<div className="space-y-3">
						{parts.map((part, idx) => (
							<div
								key={idx}
								className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 hover:border-red-300 dark:hover:border-red-800 transition-colors"
							>
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
											{part.name}
										</div>
										<div className="text-xs font-mono text-gray-500 dark:text-gray-400">
											{part.partNumber}
										</div>
									</div>
									<div className="flex items-center gap-1 ml-2">
										<TrendingUp className="w-3 h-3 text-green-600 dark:text-green-500" />
										<span className={`text-xs font-medium ${part.confidence === 'High'
												? 'text-green-700 dark:text-green-400'
												: part.confidence === 'Medium'
													? 'text-yellow-700 dark:text-yellow-400'
													: 'text-gray-700 dark:text-gray-400'
											}`}>
											{part.confidence}
										</span>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 mb-2">
									<div>
										<div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
											<DollarSign className="w-3 h-3" />
											<span>Price</span>
										</div>
										<div className="text-sm font-semibold text-gray-900 dark:text-white">
											${part.price.toFixed(2)}
										</div>
									</div>
									<div>
										<div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
											<Clock className="w-3 h-3" />
											<span>ETA</span>
										</div>
										<div className="text-sm font-semibold text-gray-900 dark:text-white">
											{part.eta}
										</div>
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
									<div className="text-xs text-gray-600 dark:text-gray-400">
										{part.supplier}
									</div>
									<span className={`px-1.5 py-0.5 text-xs font-medium rounded ${part.availability === 'In Stock'
											? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
											: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
										}`}>
										{part.availability}
									</span>
								</div>

								<button
									className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
									onClick={() => handleOrderClick(part)}
								>
									Order Parts
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Parts Ordering Sheet */}
			<PartsOrderingSheet
				parts={selectedParts}
				isOpen={isOrderingSheetOpen}
				onOpenChange={setIsOrderingSheetOpen}
			/>
		</div>
	)
}
