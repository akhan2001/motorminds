'use client'

import React from 'react'
import { AlertCircle, CheckIcon, ChevronDown, ChevronUp, Loader2, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tool } from '../elements/Tool'
import { VehicleDiagnosticsViewer } from '../locator3d/VehicleDiagnosticsViewer'
import {
	COMPONENT_LABELS,
	COMPONENT_TOOLTIPS,
} from '@/lib/services/diagnostics-3d-component-map'
import type { DiagnosticComponentId } from '@/lib/services/diagnostics-3d-locator-service'

interface ComponentLocationToolRendererProps {
	toolPart: {
		type: string
		state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
		input?: any
		output?: any
	}
}

interface ComponentLocationPayload {
	component: DiagnosticComponentId
	confidence?: number
	possibleIssue?: string
	explanation?: string
	userPrompt?: string
}

export function ComponentLocationToolRenderer({ toolPart }: ComponentLocationToolRendererProps) {
	const { state, output } = toolPart
	const [isExpanded, setIsExpanded] = React.useState(true)
	const [isHidden, setIsHidden] = React.useState(false)
	const [resetSignal, setResetSignal] = React.useState(0)
	const [activeTooltipComponent, setActiveTooltipComponent] =
		React.useState<DiagnosticComponentId | null>(null)

	if (isHidden) return null

	if (state === 'input-streaming') {
		return (
			<Tool
				icon={<Loader2 strokeWidth={1.5} size={12} className="animate-spin text-gray-600 dark:text-gray-400" />}
				label={
					<div>
						<span>Locating </span>
						<span className="text-gray-500 dark:text-gray-400">component in 3D</span>
					</div>
				}
			/>
		)
	}

	if (state === 'output-error') {
		return (
			<Tool
				icon={<AlertCircle strokeWidth={1.5} size={12} className="text-red-600 dark:text-red-400" />}
				label={
					<div>
						<span className="text-red-600 dark:text-red-400">Failed to render </span>
						<span className="text-gray-500 dark:text-gray-400">component location</span>
					</div>
				}
			>
				<div className="text-xs text-red-600 dark:text-red-400">
					{typeof output === 'string' ? output : 'Unknown error occurred'}
				</div>
			</Tool>
		)
	}

	if (state !== 'output-available' || !output) {
		return null
	}

	let payload: ComponentLocationPayload | null = null
	try {
		payload = typeof output === 'string' ? JSON.parse(output) : output
	} catch {
		payload = null
	}

	if (!payload?.component || !COMPONENT_LABELS[payload.component]) {
		return (
			<Tool
				icon={<AlertCircle strokeWidth={1.5} size={12} className="text-amber-600 dark:text-amber-400" />}
				label={
					<div>
						<span className="text-amber-600 dark:text-amber-400">Invalid </span>
						<span className="text-gray-500 dark:text-gray-400">component location payload</span>
					</div>
				}
			/>
		)
	}

	const tooltipComponent = activeTooltipComponent ?? payload.component

	return (
		<div className="space-y-2 w-full max-w-full overflow-hidden">
			<div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#171717] p-2">
				<div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
					<CheckIcon strokeWidth={1.5} size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
					<MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
					<span className="truncate">
						Component location: {COMPONENT_LABELS[payload.component]}
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setIsExpanded((value) => !value)}
						aria-label={isExpanded ? 'Collapse component locator' : 'Expand component locator'}
					>
						{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setIsHidden(true)}
						aria-label="Hide component locator"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="space-y-3 rounded-md border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#121212] p-3">
					<VehicleDiagnosticsViewer
						selectedComponent={payload.component}
						resetSignal={resetSignal}
						onComponentClick={setActiveTooltipComponent}
					/>

					<div className="flex justify-end">
						<Button variant="outline" size="sm" onClick={() => setResetSignal((value) => value + 1)}>
							Reset Camera
						</Button>
					</div>

					<div className="grid gap-1 text-xs text-muted-foreground">
						{payload.userPrompt && (
							<p>
								Triggered from:{' '}
								<span className="text-gray-900 dark:text-gray-100 font-medium">{payload.userPrompt}</span>
							</p>
						)}
						{payload.possibleIssue && (
							<p>
								Possible issue:{' '}
								<span className="text-gray-900 dark:text-gray-100 font-medium">{payload.possibleIssue}</span>
							</p>
						)}
						<p>
							Component: <span className="font-mono">{payload.component}</span> ({COMPONENT_LABELS[payload.component]})
							{typeof payload.confidence === 'number' && (
								<>
									{' '}
									| Confidence: <span className="font-mono">{payload.confidence.toFixed(2)}</span>
								</>
							)}
						</p>
						{payload.explanation && <p>{payload.explanation}</p>}
						<p>
							Tooltip ({COMPONENT_LABELS[tooltipComponent]}): {COMPONENT_TOOLTIPS[tooltipComponent]}
						</p>
					</div>
				</div>
			)}
		</div>
	)
}
