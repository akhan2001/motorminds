'use client'

import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface DTCCodesListProps {
	dtcCodes: any
}

export function DTCCodesList({ dtcCodes }: DTCCodesListProps) {
	const [isExpanded, setIsExpanded] = useState(true)
	const [expandedCode, setExpandedCode] = useState<string | null>(null)
	const [showHistorical, setShowHistorical] = useState(false)

	const activeCodes = dtcCodes?.active || []
	const historicalCodes = dtcCodes?.historical || []

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
					Diagnostic Trouble Codes
				</h3>
				{isExpanded ? (
					<ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				) : (
					<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
				)}
			</button>

			{isExpanded && (
				<div className="px-4 pb-4 pt-1">
					{/* Active Codes */}
					<div className="mb-4">
						<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
							Active ({activeCodes.length})
						</div>
						
						{activeCodes.length === 0 ? (
							<p className="text-xs text-gray-500 dark:text-gray-400">
								No active codes detected
							</p>
						) : (
							<div className="space-y-2">
								{activeCodes.map((dtc: any) => (
									<div
										key={dtc.code}
										className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden"
									>
										<button
											onClick={() => setExpandedCode(expandedCode === dtc.code ? null : dtc.code)}
											className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
										>
											<div className="flex items-start justify-between mb-1">
												<div className="flex items-center gap-2">
													<span className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
														{dtc.code}
													</span>
													<span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
														dtc.severity === 'Critical'
															? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
															: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
													}`}>
														{dtc.severity}
													</span>
												</div>
												{expandedCode === dtc.code ? (
													<ChevronUp className="w-3.5 h-3.5 text-gray-400" />
												) : (
													<ChevronDown className="w-3.5 h-3.5 text-gray-400" />
												)}
											</div>
											<div className="text-xs text-gray-600 dark:text-gray-400">
												{dtc.description}
											</div>
										</button>

										{expandedCode === dtc.code && dtc.aiSummary && (
											<div className="px-3 pb-3 pt-0">
												<div className="bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500 dark:border-blue-600 p-2 rounded">
													<div className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
														AI Analysis
													</div>
													<div className="text-xs text-blue-800 dark:text-blue-400">
														{dtc.aiSummary}
													</div>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{/* Historical Codes */}
					{historicalCodes.length > 0 && (
						<div>
							<button
								onClick={() => setShowHistorical(!showHistorical)}
								className="flex items-center justify-between w-full text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-gray-900 dark:hover:text-white"
							>
								<span>Historical ({historicalCodes.length})</span>
								{showHistorical ? (
									<ChevronUp className="w-3.5 h-3.5" />
								) : (
									<ChevronDown className="w-3.5 h-3.5" />
								)}
							</button>

							{showHistorical && (
								<div className="space-y-2">
									{historicalCodes.map((dtc: any, idx: number) => (
										<div
											key={idx}
											className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3"
										>
											<div className="flex items-start gap-2 mb-1">
												<CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-500 mt-0.5" />
												<div className="flex-1">
													<div className="text-xs font-mono font-semibold text-gray-900 dark:text-white mb-0.5">
														{dtc.code}
													</div>
													<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
														{dtc.description}
													</div>
													<div className="text-xs text-gray-500 dark:text-gray-500">
														Resolved: {new Date(dtc.resolvedDate).toLocaleDateString()}
													</div>
													{dtc.resolution && (
														<div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
															"{dtc.resolution}"
														</div>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
