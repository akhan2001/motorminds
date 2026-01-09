'use client'

import React, { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Loader2, Lock } from 'lucide-react'
import { useMotorYearsQuery } from '../data/motor/years-query'
import { useMotorMakesQuery } from '../data/motor/makes-query'
import { useMotorModelsQuery } from '../data/motor/models-query'
import { useMotorEnginesQuery } from '../data/motor/engines-query'

import type { EngineResponse } from '@/lib/integrations/motor-daas/client'

export interface YMMESelection {
	year?: number
	makeID?: number
	makeName?: string
	modelID?: number
	modelName?: string
	engineID?: number
	engineName?: string
	engineData?: EngineResponse // Full engine response object
}

interface YMMESelectorProps {
	selection: YMMESelection
	onSelectionChange: (selection: YMMESelection) => void
	readOnly?: boolean
	className?: string
}

export function YMMESelector({
	selection,
	onSelectionChange,
	readOnly = false,
	className = '',
}: YMMESelectorProps) {
	// Fetch years (always enabled) - no min/max to get all available years from sandbox
	const { data: years, isLoading: yearsLoading } = useMotorYearsQuery({})

	// Fetch makes when year is selected
	const { data: makes, isLoading: makesLoading } = useMotorMakesQuery(
		{ year: selection.year! },
		{ enabled: !!selection.year && !readOnly }
	)

	// Fetch models when year and makeID are selected
	const { data: models, isLoading: modelsLoading } = useMotorModelsQuery(
		{ year: selection.year!, makeID: selection.makeID! },
		{ enabled: !!selection.year && !!selection.makeID && !readOnly }
	)

	// Fetch engines when year, makeID, and modelID are selected
	const { data: engines, isLoading: enginesLoading } = useMotorEnginesQuery(
		{
			year: selection.year!,
			makeID: selection.makeID!,
			modelID: selection.modelID!,
		},
		{ enabled: !!selection.year && !!selection.makeID && !!selection.modelID && !readOnly }
	)

	// Handle year selection
	const handleYearChange = (yearStr: string) => {
		const year = parseInt(yearStr, 10)
		onSelectionChange({
			year,
			// Reset dependent selections
			makeID: undefined,
			makeName: undefined,
			modelID: undefined,
			modelName: undefined,
			engineID: undefined,
			engineName: undefined,
		})
	}

	// Handle make selection
	const handleMakeChange = (makeIDStr: string) => {
		const makeID = parseInt(makeIDStr, 10)
		const selectedMake = makes?.find((m) => m.MakeID === makeID)
		onSelectionChange({
			...selection,
			makeID,
			makeName: selectedMake?.MakeName,
			// Reset dependent selections
			modelID: undefined,
			modelName: undefined,
			engineID: undefined,
			engineName: undefined,
		})
	}

	// Handle model selection
	const handleModelChange = (modelIDStr: string) => {
		const modelID = parseInt(modelIDStr, 10)
		const selectedModel = models?.find((m) => m.ModelID === modelID)
		onSelectionChange({
			...selection,
			modelID,
			modelName: selectedModel?.ModelName,
			// Reset dependent selections
			engineID: undefined,
			engineName: undefined,
		})
	}

	// Handle engine selection
	const handleEngineChange = (engineIDStr: string) => {
		const engineID = parseInt(engineIDStr, 10)
		const selectedEngine = engines?.find((e) => e.EngineID === engineID)
		const engineName =
			selectedEngine?.Description ||
			selectedEngine?.Designation ||
			`${selectedEngine?.CylinderLiter || ''}L ${selectedEngine?.Cylinders || ''} ${selectedEngine?.FuelType || ''}`.trim()
		onSelectionChange({
			...selection,
			engineID,
			engineName,
			engineData: selectedEngine, // Store full engine response
		})
	}

	// Generate year options from API response only (no fallback)
	const yearOptions = useMemo(() => {
		if (years && years.length > 0) {
			return years.map((y) => y.Year).sort((a, b) => b - a) // Descending order
		}
		// Return empty array if no years from API (don't generate fallback)
		return []
	}, [years])

	if (readOnly) {
		return (
			<div className={`flex flex-col gap-2 ${className}`}>
				<div className="flex items-center gap-2 text-sm">
					<Lock className="w-4 h-4 text-muted-foreground" />
					<span className="text-muted-foreground">
						{selection.year} {selection.makeName} {selection.modelName}
						{selection.engineName && ` - ${selection.engineName}`}
					</span>
				</div>
			</div>
		)
	}

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			{/* Year Selector */}
			<div className="space-y-2">
				<Label htmlFor="year">Year *</Label>
				{yearsLoading ? (
					<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span>Loading years...</span>
					</div>
				) : yearOptions.length > 0 ? (
					<Select
						value={selection.year?.toString() || ''}
						onValueChange={handleYearChange}
					>
						<SelectTrigger id="year">
							<SelectValue placeholder="Select year" />
						</SelectTrigger>
						<SelectContent>
							{yearOptions.map((year) => (
								<SelectItem key={year} value={year.toString()}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<p className="text-sm text-muted-foreground py-2">
						No years available.
					</p>
				)}
			</div>

			{/* Make Selector */}
			{selection.year && (
				<div className="space-y-2">
					<Label htmlFor="make">Make *</Label>
					{makesLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Loading makes...</span>
						</div>
					) : makes && makes.length > 0 ? (
						<Select
							value={selection.makeID?.toString() || ''}
							onValueChange={handleMakeChange}
						>
							<SelectTrigger id="make">
								<SelectValue placeholder="Select make" />
							</SelectTrigger>
							<SelectContent>
								{makes.map((make) => (
									<SelectItem key={make.MakeID} value={make.MakeID.toString()}>
										{make.MakeName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm text-muted-foreground py-2">
							No makes available for {selection.year}
						</p>
					)}
				</div>
			)}

			{/* Model Selector */}
			{selection.year && selection.makeID && (
				<div className="space-y-2">
					<Label htmlFor="model">Model *</Label>
					{modelsLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Loading models...</span>
						</div>
					) : models && models.length > 0 ? (
						<Select
							value={selection.modelID?.toString() || ''}
							onValueChange={handleModelChange}
						>
							<SelectTrigger id="model">
								<SelectValue placeholder="Select model" />
							</SelectTrigger>
							<SelectContent>
								{models.map((model) => (
									<SelectItem key={model.ModelID} value={model.ModelID.toString()}>
										{model.ModelName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm text-muted-foreground py-2">
							No models available for {selection.makeName}
						</p>
					)}
				</div>
			)}

			{/* Engine Selector */}
			{selection.year && selection.makeID && selection.modelID && (
				<div className="space-y-2">
					<Label htmlFor="engine">Engine {selection.engineID ? '' : ''}</Label>
					{enginesLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
							<Loader2 className="w-4 h-4 animate-spin" />
							<span>Loading engines...</span>
						</div>
					) : engines && engines.length > 0 ? (
						<Select
							value={selection.engineID?.toString() || ''}
							onValueChange={handleEngineChange}
						>
							<SelectTrigger id="engine">
								<SelectValue placeholder="Select engine (optional)" />
							</SelectTrigger>
							<SelectContent>
								{engines.map((engine) => {
									const displayName =
										engine.Description ||
										engine.Designation ||
										`${engine.CylinderLiter || ''}L ${engine.Cylinders || ''} ${engine.FuelType || ''}`.trim()
									return (
										<SelectItem key={engine.EngineID} value={engine.EngineID.toString()}>
											{displayName}
										</SelectItem>
									)
								})}
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm text-muted-foreground py-2">
							No engines available for this vehicle
						</p>
					)}
				</div>
			)}
		</div>
	)
}

