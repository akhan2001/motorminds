'use client'

import React from 'react'
import { Tool } from '../elements/Tool'
import { CheckIcon, Loader2, AlertCircle, Package } from 'lucide-react'
import { OEMCopyrightHover, OEMCopyrightPrint } from '../interfaces'
import { detectOEMsInContent } from '@/lib/integrations/motor-daas/oem-detection'

interface OEMComponentsToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

export function OEMComponentsToolRenderer({ toolPart }: OEMComponentsToolRendererProps) {
	const { state, input, output } = toolPart

	// Loading state
	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Searching </span>
						<span className="text-gray-500 dark:text-gray-400">OEM components</span>
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
						<span className="text-gray-500 dark:text-gray-400">OEM components</span>
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
							<span className="text-gray-500 dark:text-gray-400">OEM components</span>
						</div>
					}
				>
					<div className="text-xs text-red-600 dark:text-red-400">
						<strong>Error:</strong> {parsedResult.error || parsedResult.message || 'Unknown error'}
					</div>
				</Tool>
			)
		}

		// Success - show components list
		const components = parsedResult.components || []
		const totalCount = parsedResult.totalCount || components.length
		const searchTerm = parsedResult.searchTerm

		// Detect OEMs from vehicle make (if available) or use default (Honda)
		const vehicleMake = input?.vehicleMake || parsedResult?.vehicleMake || 'Honda'
		const detectedOEMs = detectOEMsInContent({ 
			vehicleMake,
			partNumbers: components.map((c: any) => c.partNumber || c.partNumbers?.[0]?.PartNumber).filter(Boolean),
			contentMetadata: parsedResult 
		})

		return (
			<Tool
				icon={<CheckIcon strokeWidth={1.5} size={12} className="text-green-600 dark:text-green-400" />}
				label={
					<div className="flex items-center gap-2">
						<span>Found </span>
						<span className="text-gray-500 dark:text-gray-400">{totalCount} component{totalCount !== 1 ? 's' : ''}</span>
						{detectedOEMs.length > 0 && (
							<OEMCopyrightHover oems={detectedOEMs} iconSize={12} />
						)}
					</div>
				}
			>
				<div className="space-y-3 w-full max-w-full">
					{/* Context info */}
					{searchTerm && (
						<div className="text-xs text-gray-600 dark:text-gray-400 break-words">
							<strong>Search:</strong> "{searchTerm}"
						</div>
					)}

					{/* Components list */}
					{components.length > 0 ? (
						<div className="space-y-2 max-h-[400px] overflow-y-auto w-full">
							{components.map((component: any, idx: number) => {
								const componentName = component.name || `Component ${component.id || idx + 1}`
								const partNumber = component.partNumber || (component.partNumbers && component.partNumbers[0]?.PartNumber)
								
								return (
									<div key={component.id || idx}>
										<div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors w-full">
											<Package className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
											<div className="flex-1 min-w-0 overflow-hidden">
												<div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
													{componentName}
												</div>
												{component.description && (
													<div className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">
														{component.description}
													</div>
												)}
												{partNumber && (
													<div className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
														Part: {partNumber}
													</div>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					) : (
						<div className="text-xs text-gray-500 dark:text-gray-400">
							No components found.
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
					<span className="text-gray-500 dark:text-gray-400">getOEMComponents</span>
				</div>
			}
		/>
	)
}

