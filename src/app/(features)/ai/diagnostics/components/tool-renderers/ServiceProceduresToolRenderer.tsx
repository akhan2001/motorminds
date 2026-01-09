'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import { useChatContextOptional } from '../Chat.Context'
import { cn } from '@/lib/utils'

interface ServiceProceduresToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

/**
 * Renders the list of available service procedures from getServiceProcedures tool
 * Options are clickable to request the procedure details
 */
export function ServiceProceduresToolRenderer({ toolPart }: ServiceProceduresToolRendererProps) {
	const { state, input, output } = toolPart
	const chatContext = useChatContextOptional()
	const [selectedId, setSelectedId] = React.useState<number | null>(null)

	// Parse output early (before conditional returns)
	let parsedResult: any = null
	let procedures: Array<{
		id: number
		name: string
		category?: string
		position?: string
		taxonomy?: string
	}> = []

	if (state === 'output-available' && output) {
		try {
			if (typeof output === 'string') {
				parsedResult = JSON.parse(output)
			} else {
				parsedResult = output
			}
		} catch {
			parsedResult = { message: String(output) }
		}

		if (parsedResult.success !== false) {
			procedures = parsedResult.procedures || []
		}
	}

	const handleProcedureClick = async (procedure: { id: number; name: string }) => {
		if (!chatContext) return
		
		setSelectedId(procedure.id)
		
		// Send a message to trigger getServiceProcedureDetails
		await chatContext.sendMessage(`Show me the "${procedure.name}" procedure`)
	}

	// Loading state
	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Searching </span>
						<span className="text-gray-500 dark:text-gray-400">service procedures</span>
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
						<span className="text-gray-500 dark:text-gray-400">service procedures</span>
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
	if (state === 'output-available' && output && parsedResult) {
		// Check if request failed
		if (parsedResult.success === false) {
			return (
				<Tool
					icon={<AlertCircle strokeWidth={1.5} size={12} className="text-amber-600 dark:text-amber-400" />}
					label={
						<div>
							<span className="text-amber-600 dark:text-amber-400">No procedures found</span>
						</div>
					}
				>
					<div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
						<p>{parsedResult.message || 'No matching procedures found.'}</p>
						{parsedResult.suggestions && (
							<ul className="list-disc list-inside text-gray-500 dark:text-gray-400">
								{parsedResult.suggestions.map((s: string, i: number) => (
									<li key={i}>{s}</li>
								))}
							</ul>
						)}
					</div>
				</Tool>
			)
		}

		// Success - show procedures list
		const query = parsedResult.query
		const matchedCategory = parsedResult.matchedCategory
		const totalCount = parsedResult.totalCount || procedures.length

		return (
			<div className="space-y-3 w-full max-w-full overflow-hidden">
				{/* Status indicator */}
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
					<CheckIcon strokeWidth={1.5} size={14} className="text-green-600 dark:text-green-400" />
					<span>Found {totalCount} service procedure{totalCount !== 1 ? 's' : ''}</span>
				</div>

				{/* Context info */}
				{(query || matchedCategory) && (
					<div className="text-xs text-gray-600 dark:text-gray-400 break-words">
						{query && (
							<span>
								<strong>Search:</strong> "{query}"
							</span>
						)}
						{matchedCategory && (
							<span className="ml-2">
								<strong>Category:</strong> {matchedCategory}
							</span>
						)}
					</div>
				)}

				{/* Procedures list - clickable */}
				{procedures.length > 0 ? (
					<div className="space-y-2 w-full">
						{procedures.map((procedure, idx) => {
							const isSelected = selectedId === procedure.id
							const isClickable = !!chatContext && !isSelected
							
							return (
								<div
									key={procedure.id || idx}
									onClick={() => isClickable && handleProcedureClick(procedure)}
									className={cn(
										"flex items-start gap-3 p-3 rounded-lg border w-full transition-colors",
										isClickable && "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700",
										isSelected 
											? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700" 
											: "border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]"
									)}
								>
									<FileText className={cn(
										"w-4 h-4 flex-shrink-0 mt-0.5",
										isSelected ? "text-blue-600 dark:text-blue-400" : "text-blue-600 dark:text-blue-400"
									)} />
									<div className="flex-1 min-w-0">
										<div className={cn(
											"text-sm font-medium break-words",
											isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"
										)}>
											{procedure.name}
										</div>
										{(procedure.category || procedure.position) && (
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
												{procedure.category}
												{procedure.position && ` • ${procedure.position}`}
											</div>
										)}
									</div>
									{isSelected ? (
										<Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
									) : (
										<ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
									)}
								</div>
							)
						})}
					</div>
				) : (
					<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
						<p>No service procedures found for "{query}".</p>
						<p className="text-gray-400 dark:text-gray-500">
							Try a different search term like "battery", "alternator", or "timing belt".
						</p>
					</div>
				)}

				{/* Instruction for user */}
				{procedures.length > 0 && !selectedId && (
					<div className="text-xs text-gray-500 dark:text-gray-400 italic pt-2 border-t border-gray-100 dark:border-gray-800">
						Click a procedure to view the full details.
					</div>
				)}
			</div>
		)
	}

	// Default fallback
	return (
		<Tool
			icon={<CheckIcon strokeWidth={1.5} size={12} className="text-gray-500 dark:text-gray-400" />}
			label={
				<div>
					<span>Ran </span>
					<span className="text-gray-500 dark:text-gray-400">getServiceProcedures</span>
				</div>
			}
		/>
	)
}
