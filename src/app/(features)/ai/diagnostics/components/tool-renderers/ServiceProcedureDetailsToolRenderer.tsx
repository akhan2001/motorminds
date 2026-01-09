'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, ClipboardList, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '../Message.Markdown'
import { DocumentImageCompact } from '../elements/DocumentImage'
import { cn } from '@/lib/utils'

interface ServiceProcedureDetailsToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

interface ProcedureStep {
	sequence: number
	text: string
	image?: {
		id: number
		name: string
		caption?: string
		format: string
	}
}

interface ProcedureImage {
	id: number
	name: string
	caption?: string
	format: string
	sequence: number
}

/**
 * Renders interleaved procedure steps with images
 * Format: [Step 1 text] [Image 1] [Step 2 text] [Image 2] ...
 */
export function ServiceProcedureDetailsToolRenderer({ toolPart }: ServiceProcedureDetailsToolRendererProps) {
	const { state, output } = toolPart
	const [collapsedImages, setCollapsedImages] = React.useState<Set<number>>(new Set()) // Images expanded by default

	// Parse output
	let parsedResult: any = null
	let steps: ProcedureStep[] = []
	let allImages: ProcedureImage[] = []

	if (state === 'output-available' && output) {
		try {
			parsedResult = typeof output === 'string' ? JSON.parse(output) : output
		} catch {
			parsedResult = { message: String(output) }
		}

		if (parsedResult.success !== false) {
			steps = parsedResult.steps || []
			allImages = parsedResult.images || []
		}
	}

	const toggleImage = (index: number) => {
		setCollapsedImages(prev => {
			const newSet = new Set(prev)
			if (newSet.has(index)) {
				newSet.delete(index)
			} else {
				newSet.add(index)
			}
			return newSet
		})
	}

	// Count steps with images
	const stepsWithImages = steps.filter(s => s.image).length

	// Loading state
	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Loading </span>
						<span className="text-gray-500 dark:text-gray-400">procedure details</span>
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
						<span className="text-gray-500 dark:text-gray-400">procedure details</span>
					</div>
				}
			>
				<div className="text-xs text-red-600 dark:text-red-400">
					{typeof output === 'string' ? output : 'Unknown error occurred'}
				</div>
			</Tool>
		)
	}

	// Success state
	if (state === 'output-available' && output && parsedResult) {
		if (parsedResult.success === false) {
			return (
				<Tool
					icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
					label={
						<div>
							<span className="text-red-600 dark:text-red-400">Procedure not found</span>
						</div>
					}
				>
					<div className="text-xs text-red-600 dark:text-red-400">
						{parsedResult.error || 'Could not load the procedure details.'}
					</div>
				</Tool>
			)
		}

		const procedureName = parsedResult.procedureName || 'Service Procedure'
		const category = parsedResult.category
		const position = parsedResult.position
		const baseVehicleId = parsedResult.baseVehicleId

		return (
			<div className="space-y-4 w-full max-w-full overflow-hidden">
				{/* Header */}
				<div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
					<ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
					<div className="flex-1 min-w-0">
						<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words">
							{procedureName}
						</h3>
						{(category?.Article || position) && (
							<div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
								{category?.Article}
								{position && ` • ${position}`}
							</div>
						)}
						<div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-3">
							<span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
							{stepsWithImages > 0 && (
								<span className="flex items-center gap-1">
									<ImageIcon className="w-3 h-3" />
									{stepsWithImages} illustration{stepsWithImages !== 1 ? 's' : ''}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Interleaved Steps and Images */}
				{steps.length > 0 && (
					<div className="space-y-3">
						{steps.map((step, index) => {
							const isImageCollapsed = collapsedImages.has(index)
							
							return (
								<div key={index} className="space-y-2">
									{/* Step with number */}
									<div className="flex gap-3 items-start">
										{/* Step number */}
										<div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-medium mt-0.5">
											{step.sequence}
										</div>
										
										{/* Step text */}
										<div className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none">
											<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
												{step.text}
											</ReactMarkdown>
										</div>
									</div>

									{/* Step image - auto-expanded if present */}
									{step.image && baseVehicleId && (
										<div className="ml-10 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] overflow-hidden">
											{/* Collapsible header */}
											<div
												className={cn(
													"flex items-center gap-2 p-2 cursor-pointer transition-colors",
													"hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
												)}
												onClick={() => toggleImage(index)}
											>
												{isImageCollapsed ? (
													<ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
												) : (
													<ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
												)}
												<ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
												<span className="text-sm text-gray-700 dark:text-gray-300 truncate">
													{step.image.caption || step.image.name || `Figure ${index + 1}`}
												</span>
											</div>

											{/* Image content - expanded by default */}
											{!isImageCollapsed && (
												<div className="p-3 border-t border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
													<DocumentImageCompact
														src={`/api/motor-daas/service-procedures/${baseVehicleId}/document/${step.image.id}`}
														alt={step.image.caption || step.image.name || 'Procedure illustration'}
														caption={step.image.caption}
													/>
												</div>
											)}
										</div>
									)}
								</div>
							)
						})}
					</div>
				)}

				{/* Fallback: show all images in gallery if no steps but images exist */}
				{steps.length === 0 && allImages.length > 0 && (
					<div className="space-y-3">
						<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
							<ImageIcon className="w-4 h-4" />
							Illustrations
						</h4>
						<div className="grid gap-3">
							{allImages.map((image, index) => {
								const isCollapsed = collapsedImages.has(index)
								const imageUrl = baseVehicleId 
									? `/api/motor-daas/service-procedures/${baseVehicleId}/document/${image.id}`
									: null

								return (
									<div
										key={image.id}
										className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] overflow-hidden"
									>
										<div
											className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222222]"
											onClick={() => toggleImage(index)}
										>
											{isCollapsed ? (
												<ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
											) : (
												<ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
											)}
											<ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
											<span className="text-sm text-gray-700 dark:text-gray-300 truncate">
												{image.caption || image.name || `Image ${index + 1}`}
											</span>
										</div>

										{!isCollapsed && imageUrl && (
											<div className="p-3 border-t border-gray-200 dark:border-[#2a2a2a]">
												<DocumentImageCompact
													src={imageUrl}
													alt={image.caption || image.name || 'Procedure illustration'}
													caption={image.caption}
												/>
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* No content fallback */}
				{steps.length === 0 && allImages.length === 0 && (
					<div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center border border-gray-200 dark:border-[#2a2a2a] rounded-lg">
						No procedure content available.
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
					<span className="text-gray-500 dark:text-gray-400">getServiceProcedureDetails</span>
				</div>
			}
		/>
	)
}
