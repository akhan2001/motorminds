'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiagramViewer } from '../diagram-viewer/DiagramViewer'
import { OEMCopyrightHover, OEMCopyrightPrint } from '../interfaces'
import { detectOEMsInContent } from '@/lib/integrations/motor-daas/oem-detection'

interface RelatedDiagramsToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

export function RelatedDiagramsToolRenderer({ toolPart }: RelatedDiagramsToolRendererProps) {
	const { state, input, output } = toolPart
	const [viewingDiagramId, setViewingDiagramId] = React.useState<number | null>(null)

	// Loading state
	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Finding </span>
						<span className="text-gray-500 dark:text-gray-400">related wiring diagrams</span>
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
						<span className="text-gray-500 dark:text-gray-400">related diagrams</span>
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
							<span className="text-gray-500 dark:text-gray-400">related diagrams</span>
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
		const totalCount = parsedResult.totalCount || diagrams.length
		const contentType = parsedResult.contentType
		const relatedToApplicationId = parsedResult.relatedToApplicationId
		
		// Extract baseVehicleId from input
		const vehicleIdFromInput = input?.baseVehicleId
		const defaultVehicleId = 22124 // 2010 Honda Civic
		const currentBaseVehicleId: number = vehicleIdFromInput 
			? (typeof vehicleIdFromInput === 'string' ? parseInt(vehicleIdFromInput, 10) : vehicleIdFromInput)
			: defaultVehicleId

		// Detect OEMs from vehicle make (if available) or use default (Honda)
		const vehicleMake = input?.vehicleMake || parsedResult?.vehicleMake || 'Honda'
		const detectedOEMs = detectOEMsInContent({ 
			vehicleMake,
			contentMetadata: parsedResult 
		})

		return (
			<Tool
				icon={<CheckIcon strokeWidth={1.5} size={12} className="text-green-600 dark:text-green-400" />}
				label={
					<div className="flex items-center gap-2">
						<span>Found </span>
						<span className="text-gray-500 dark:text-gray-400">{totalCount} related diagram{totalCount !== 1 ? 's' : ''}</span>
						{detectedOEMs.length > 0 && (
							<OEMCopyrightHover oems={detectedOEMs} iconSize={12} />
						)}
					</div>
				}
			>
				<div className="space-y-3 w-full max-w-full">
					{/* Context info */}
					{(contentType || relatedToApplicationId) && (
						<div className="text-xs text-gray-600 dark:text-gray-400 break-words">
							{contentType && (
								<span>
									<strong>Related to:</strong> {contentType}
								</span>
							)}
							{relatedToApplicationId && (
								<span className="ml-2">
									(Application ID: {relatedToApplicationId})
								</span>
							)}
						</div>
					)}

					{/* Viewing diagram */}
					{viewingDiagramId && currentBaseVehicleId && (
						<div className="mt-4 space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
									Wiring Diagram
								</h4>
								<Button
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
									onClick={() => {
										setViewingDiagramId(null)
									}}
								>
									×
								</Button>
							</div>
							<DiagramViewer
								baseVehicleId={currentBaseVehicleId}
								applicationId={viewingDiagramId}
								diagramName={
									diagrams.find((d: { id: number }) => d.id === viewingDiagramId)?.name ||
									`Diagram ${viewingDiagramId}`
								}
								vehicleMake={vehicleMake}
							/>
						</div>
					)}

					{/* Diagrams list */}
					{diagrams.length > 0 ? (
						<div className="space-y-2 max-h-[400px] overflow-y-auto w-full">
							{diagrams.map((diagram: { id: number; name: string; href?: string }, idx: number) => {
								const diagramName = diagram.name || `Diagram ${diagram.id || idx + 1}`
								const isViewing = viewingDiagramId === diagram.id
								
								return (
									<div key={diagram.id || idx}>
										<div className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors w-full">
											<div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
												<FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
												<span className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words min-w-0">
													{diagramName}
												</span>
											</div>
											<Button
												size="sm"
												variant={isViewing ? 'default' : 'outline'}
												className="h-7 px-3 text-xs flex-shrink-0"
												onClick={() => {
													if (isViewing) {
														setViewingDiagramId(null)
													} else {
														setViewingDiagramId(diagram.id)
													}
												}}
											>
												{isViewing ? 'Hide' : 'View'}
											</Button>
										</div>
									</div>
								)
							})}
						</div>
					) : (
						<div className="text-xs text-gray-500 dark:text-gray-400">
							No related diagrams found.
						</div>
					)}

					{/* Print-only OEM copyright notice */}
					{detectedOEMs.length > 0 && (
						<OEMCopyrightPrint oems={detectedOEMs} />
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
					<span className="text-gray-500 dark:text-gray-400">getRelatedWiringDiagrams</span>
				</div>
			}
		/>
	)
}

