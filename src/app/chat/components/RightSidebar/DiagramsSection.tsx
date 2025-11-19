'use client'

import React, { useState } from 'react'
import { FileText, Zap, MapPin, Download, ChevronDown, ChevronUp } from 'lucide-react'

interface DiagramsSectionProps {
	diagrams: any[]
}

export function DiagramsSection({ diagrams }: DiagramsSectionProps) {
	const [isExpanded, setIsExpanded] = useState(true)

	if (!diagrams || diagrams.length === 0) {
		return null
	}

	const getIcon = (type: string) => {
		switch (type) {
			case 'Wiring Diagram':
				return <Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
			case 'Component Location':
				return <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
			case 'Repair Procedure':
				return <FileText className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
			default:
				return <FileText className="w-3.5 h-3.5 text-gray-600 dark:text-gray-500" />
		}
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors rounded-t-lg"
			>
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
					<FileText className="w-4 h-4 text-red-600 dark:text-red-500" />
					Diagrams & Procedures
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
						{diagrams.map((diagram) => (
							<button
								key={diagram.id}
								disabled={!diagram.available}
								className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] hover:border-red-300 dark:hover:border-red-800 hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
							>
								<div className="flex items-start gap-2 mb-1.5">
									{getIcon(diagram.type)}
									<div className="flex-1">
										<div className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">
											{diagram.title}
										</div>
										<div className="text-xs text-gray-600 dark:text-gray-400">
											{diagram.description}
										</div>
									</div>
									<Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-500" />
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									{diagram.type}
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
