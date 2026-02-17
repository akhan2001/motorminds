'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagramViewer } from '../diagram-viewer/DiagramViewer'
import { ComponentLocationToolRenderer } from './ComponentLocationToolRenderer'

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
	// Auto-show first diagram by default, allow toggling
	const [viewingDiagramIds, setViewingDiagramIds] = React.useState<Set<number>>(new Set())
	const [autoExpanded, setAutoExpanded] = React.useState(false)

	// Parse output early (before conditional returns)
	let parsedResult: any = null
	let diagrams: Array<{ id: number; name: string; href?: string }> = []
	
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
			diagrams = parsedResult.diagrams || []
		}
	}

	// Get first diagram ID for stable dependency
	const firstDiagramId = diagrams.length > 0 ? diagrams[0].id : null

	// Auto-expand first diagram on mount (must be at top level, before conditional returns)
	React.useEffect(() => {
		if (!autoExpanded && firstDiagramId !== null && viewingDiagramIds.size === 0) {
			setViewingDiagramIds(new Set([firstDiagramId]))
			setAutoExpanded(true)
		}
	}, [autoExpanded, firstDiagramId, viewingDiagramIds.size])

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
	if (state === 'output-available' && output && parsedResult) {
		if (parsedResult.switchToComponentLocation && parsedResult.component) {
			return (
				<ComponentLocationToolRenderer
					toolPart={{
						type: 'tool-showComponentLocation',
						state: 'output-available',
						output: {
							component: parsedResult.component,
							confidence: parsedResult.confidence,
							possibleIssue: parsedResult.possibleIssue,
							explanation: parsedResult.explanation,
							userPrompt: parsedResult.userPrompt || input?.query,
						},
					}}
				/>
			)
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

		// Success - show diagrams list directly (not in collapsible)
		const mode = parsedResult.mode || 'search'
		const subject = parsedResult.subject
		const searchTerm = parsedResult.searchTerm
		const totalCount = parsedResult.totalCount || diagrams.length
		
		// Extract baseVehicleId from tool output (preferred) or input
		const vehicleIdFromOutput = parsedResult?.baseVehicleId
		const vehicleIdFromInput = input?.baseVehicleId
		const rawVehicleId = vehicleIdFromOutput || vehicleIdFromInput
		
		if (!rawVehicleId) {
			console.warn('[WiringDiagramsToolRenderer] No baseVehicleId in output or input')
		}
		
		const currentBaseVehicleId: number = rawVehicleId 
			? (typeof rawVehicleId === 'string' ? parseInt(rawVehicleId, 10) : rawVehicleId)
			: 0 // No default - will show error if missing

		const toggleDiagram = (diagramId: number) => {
			setViewingDiagramIds(prev => {
				const newSet = new Set(prev)
				if (newSet.has(diagramId)) {
					newSet.delete(diagramId)
				} else {
					newSet.add(diagramId)
				}
				return newSet
			})
		}

		return (
			<div className="space-y-3 w-full max-w-full overflow-hidden">
				{/* Status indicator with OEM copyright hover */}
				<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
					<CheckIcon strokeWidth={1.5} size={14} className="text-green-600 dark:text-green-400" />
					<span>Found {totalCount} wiring diagram{totalCount !== 1 ? 's' : ''}</span>
				</div>

				{/* Context info */}
				{(subject || searchTerm) && (
					<div className="text-xs text-gray-600 dark:text-gray-400 break-words overflow-wrap-anywhere">
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

				{/* Diagrams with inline viewing */}
				{diagrams.length > 0 ? (
					<div className="space-y-3 w-full">
						{diagrams.map((diagram: { id: number; name: string; href?: string }, idx: number) => {
							const diagramName = diagram.name || `Diagram ${diagram.id || idx + 1}`
							const isViewing = viewingDiagramIds.has(diagram.id)
							
							return (
								<div key={diagram.id || idx} className="w-full overflow-hidden">
									{/* Diagram header */}
									<div
										className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors w-full cursor-pointer"
										onClick={() => toggleDiagram(diagram.id)}
									>
										<div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
											<FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
											<span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words min-w-0 overflow-wrap-anywhere">
												{diagramName}
											</span>
										</div>
										<Button
											size="sm"
											variant={isViewing ? 'default' : 'outline'}
											className="h-7 px-3 text-xs flex-shrink-0"
											onClick={(e) => {
												e.stopPropagation()
												toggleDiagram(diagram.id)
											}}
										>
											{isViewing ? 'Hide' : 'Show'}
										</Button>
									</div>
									
									{/* Diagram viewer (inline) */}
									{isViewing && currentBaseVehicleId && (
										<div className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] w-full overflow-hidden">
											<DiagramViewer
												baseVehicleId={currentBaseVehicleId}
												applicationId={diagram.id}
												diagramName={diagramName}
												engineId={parsedResult?.engineId || input?.engineId}
											/>
										</div>
									)}
								</div>
							)
						})}
					</div>
				) : (
					<div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
						<p>No wiring diagrams found for "{searchTerm || subject}".</p>
						<p className="text-gray-400 dark:text-gray-500">
							Try searching for a different component or browse by subject (e.g., "Engine", "Brakes", "Electrical").
						</p>
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
					<span className="text-gray-500 dark:text-gray-400">getWiringDiagrams</span>
				</div>
			}
		/>
	)
}

