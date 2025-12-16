'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WiringDiagramsToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

export function WiringDiagramsToolRenderer({ toolPart }: WiringDiagramsToolRendererProps) {
	const { state, input, output } = toolPart

	// Loading state
	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Searching </span>
						<span className="text-gray-500 dark:text-gray-400">wiring diagrams</span>
					</div>
				}
			/>
		)
	}

	// Error state
	if (state === 'output-error') {
		return (
			<Tool
				icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
				label={
					<div>
						<span className="text-red-600 dark:text-red-400">Failed to load </span>
						<span className="text-gray-500 dark:text-gray-400">wiring diagrams</span>
					</div>
				}
			>
				<div className="text-xs text-red-600 dark:text-red-400">
					{typeof output === 'string' ? output : 'Unknown error occurred'}
				</div>
			</Tool>
		)
	}

	// Success state with output
	if (state === 'output-available' && output) {
		let parsedResult: any

		try {
			if (typeof output === 'string') {
				parsedResult = JSON.parse(output)
			} else {
				parsedResult = output
			}
		} catch {
			parsedResult = { message: String(output) }
		}

		// Check if request failed
		if (parsedResult.success === false) {
			return (
				<Tool
					icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
					label={
						<div>
							<span className="text-red-600 dark:text-red-400">Failed to retrieve </span>
							<span className="text-gray-500 dark:text-gray-400">wiring diagrams</span>
						</div>
					}
				>
					<div className="text-xs text-red-600 dark:text-red-400">
						<strong>Error:</strong> {parsedResult.error || parsedResult.message || 'Unknown error'}
					</div>
				</Tool>
			)
		}

		// Success - show diagrams list
		const diagrams = parsedResult.diagrams || []
		const mode = parsedResult.mode || 'search'
		const subject = parsedResult.subject
		const searchTerm = parsedResult.searchTerm
		const totalCount = parsedResult.totalCount || diagrams.length

		return (
			<Tool
				icon={<CheckIcon strokeWidth={1.5} size={12} className="text-green-600 dark:text-green-400" />}
				label={
					<div>
						<span>Found </span>
						<span className="text-gray-500 dark:text-gray-400">{totalCount} wiring diagram{totalCount !== 1 ? 's' : ''}</span>
					</div>
				}
			>
				<div className="space-y-3 w-full max-w-full">
					{/* Context info */}
					{(subject || searchTerm) && (
						<div className="text-xs text-gray-600 dark:text-gray-400 break-words">
							{mode === 'browse' && subject && (
								<span>
									<strong>Subject:</strong> {subject}
								</span>
							)}
							{mode === 'search' && searchTerm && (
								<span>
									<strong>Search:</strong> "{searchTerm}"
								</span>
							)}
						</div>
					)}

					{/* Diagrams list */}
					{diagrams.length > 0 ? (
						<div className="space-y-2 max-h-[400px] overflow-y-auto w-full">
							{diagrams.map((diagram: { id: number; name: string; href?: string }, idx: number) => {
								const diagramName = diagram.name || `Diagram ${diagram.id || idx + 1}`
								return (
									<div
										key={diagram.id || idx}
										className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors w-full"
									>
										<div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
											<FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
											<span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">
												{diagramName}
											</span>
										</div>
										<Button
											size="sm"
											variant="outline"
											className="h-7 px-3 text-xs flex-shrink-0"
											onClick={() => {
												// TODO: Phase 2 - Open diagram in right panel
												console.log('View diagram:', diagram.id, diagramName)
											}}
										>
											View
										</Button>
									</div>
								)
							})}
						</div>
					) : (
						<div className="text-xs text-gray-500 dark:text-gray-400">
							No wiring diagrams found.
						</div>
					)}
				</div>
			</Tool>
		)
	}

	// Default fallback
	return (
		<Tool
			icon={<CheckIcon strokeWidth={1.5} size={12} className="text-gray-500 dark:text-gray-400" />}
			label={
				<div>
					<span>Ran </span>
					<span className="text-gray-500 dark:text-gray-400">getWiringDiagrams</span>
				</div>
			}
		/>
	)
}

