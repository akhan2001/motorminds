'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function isMotorTool(toolName: string): boolean {
	const motorTools = [
		'lookup_dtc',
		'get_vehicle_info',
		'get_vehicle_history',
		'search_tsb',
		'estimate_labor',
		'get_parts_pricing',
		'get_service_procedure',
		'get_specifications',
		'get_maintenance_schedule',
		'get_recommended_fluids',
		'estimate_repair_cost'
	]
	return motorTools.includes(toolName)
}

interface MotorToolDisplayProps {
	toolName: string
	input: any
	output?: any
	state: 'output-streaming' | 'output-available' | 'error'
}

export function MotorToolDisplay({ toolName, input, output, state }: MotorToolDisplayProps) {
	const getToolLabel = (name: string) => {
		const labels: Record<string, string> = {
			lookup_dtc: 'DTC Lookup',
			get_vehicle_info: 'Vehicle Info',
			get_vehicle_history: 'Service History',
			search_tsb: 'TSB Search',
			estimate_labor: 'Labor Estimate',
			get_parts_pricing: 'Parts Pricing',
			get_service_procedure: 'Service Procedure',
			get_specifications: 'Specifications',
			get_maintenance_schedule: 'Maintenance Schedule',
			get_recommended_fluids: 'Recommended Fluids',
			estimate_repair_cost: 'Cost Estimate'
		}
		return labels[name] || name
	}

	return (
		<Card className="mt-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium flex items-center gap-2">
						{state === 'output-streaming' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
						{state === 'output-available' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
						{state === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
						{getToolLabel(toolName)}
					</CardTitle>
					<Badge variant="outline" className="text-xs">
						MOTOR DaaS
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				{input && (
					<div className="mb-2">
						<p className="text-xs text-muted-foreground mb-1">Input:</p>
						<pre className="text-xs bg-white dark:bg-[#1a1a1a] p-2 rounded border overflow-x-auto">
							{JSON.stringify(input, null, 2)}
						</pre>
					</div>
				)}
				{output && state === 'output-available' && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Result:</p>
						<pre className="text-xs bg-white dark:bg-[#1a1a1a] p-2 rounded border overflow-x-auto max-h-[300px] overflow-y-auto">
							{JSON.stringify(output, null, 2)}
						</pre>
					</div>
				)}
				{state === 'output-streaming' && (
					<div className="text-xs text-muted-foreground">Fetching data from MOTOR DaaS...</div>
				)}
				{state === 'error' && (
					<div className="text-xs text-red-600 dark:text-red-400">
						Error fetching data. Please try again.
					</div>
				)}
			</CardContent>
		</Card>
	)
}

