'use client'

import React, { useState } from 'react'
import { History, Wrench, FileText, Paperclip, ChevronDown, ChevronUp } from 'lucide-react'

interface ServiceHistoryProps {
	history: any[]
}

export function ServiceHistory({ history }: ServiceHistoryProps) {
	const [isExpanded, setIsExpanded] = useState(true)
	const [showAll, setShowAll] = useState(false)
	const displayHistory = showAll ? history : history.slice(0, 3)

	if (!history || history.length === 0) {
		return null
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<History className="w-4 h-4 text-red-600 dark:text-red-500" />
					Service History ({history.length})
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
						{displayHistory.map((record, idx) => (
							<div
								key={idx}
								className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3"
							>
								<div className="flex items-start justify-between mb-2">
									<div className="flex items-center gap-2">
										<Wrench className={`w-3.5 h-3.5 ${
											record.type === 'Repair'
												? 'text-red-600 dark:text-red-500'
												: 'text-blue-600 dark:text-blue-500'
										}`} />
										<span className="text-xs font-semibold text-gray-900 dark:text-white">
											{record.type}
										</span>
									</div>
									<span className="text-xs text-gray-500 dark:text-gray-400">
										{new Date(record.date).toLocaleDateString()}
									</span>
								</div>

								<div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
									{record.description}
								</div>

								<div className="flex items-center justify-between text-xs">
									<div className="text-gray-600 dark:text-gray-400">
										{record.technician}
									</div>
									<div className="font-medium text-gray-900 dark:text-white">
										${record.amount.toFixed(2)}
									</div>
								</div>

								{record.attachments && record.attachments.length > 0 && (
									<div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
										<div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
											<Paperclip className="w-3 h-3" />
											<span>{record.attachments.length} attachment(s)</span>
										</div>
									</div>
								)}

								<button className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400">
									<FileText className="w-3 h-3" />
									<span>View {record.invoiceNumber}</span>
								</button>
							</div>
						))}
					</div>

					{history.length > 3 && (
						<button
							onClick={() => setShowAll(!showAll)}
							className="w-full mt-3 text-xs font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400"
						>
							{showAll ? 'Show Less' : `Show All (${history.length - 3} more)`}
						</button>
					)}
				</div>
			)}
		</div>
	)
}
