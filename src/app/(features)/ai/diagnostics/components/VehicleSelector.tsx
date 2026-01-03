'use client'

import React, { useState, useEffect } from 'react'
import { YMMESelector, type YMMESelection } from './YMMESelector'
import { useBaseVehicleQuery } from '../data/motor/base-vehicle-query'

import type { EngineResponse } from '@/lib/integrations/motor-daas/client'

export interface SandboxVehicle {
	id?: number
	motorId?: number
	year: number
	make: string
	model: string
	makeID?: number
	modelID?: number
	engineId?: number
	engineName?: string
	engineData?: EngineResponse // Full engine response object
	baseVehicleId?: number
	vin?: string
	plate?: string
	customerName?: string
	activeDTCCodes?: string[]
}

interface VehicleSelectorProps {
	selectedVehicle: SandboxVehicle | null
	onVehicleSelect: (vehicle: SandboxVehicle) => void
	readOnly?: boolean
	lockMessage?: string
	showEngineSelector?: boolean
}

export default function VehicleSelector({
	selectedVehicle,
	onVehicleSelect,
	readOnly = false,
	lockMessage = 'Vehicle locked for this session',
	showEngineSelector = true
}: VehicleSelectorProps) {
	// Internal state for YMME selection (allows partial updates for UI)
	const [internalSelection, setInternalSelection] = useState<YMMESelection>(() => {
		if (!selectedVehicle) {
			return {}
		}
		return {
			year: selectedVehicle.year,
			makeID: selectedVehicle.makeID,
			makeName: selectedVehicle.make,
			modelID: selectedVehicle.modelID,
			modelName: selectedVehicle.model,
			engineID: selectedVehicle.engineId,
			engineName: selectedVehicle.engineName,
			engineData: selectedVehicle.engineData,
		}
	})

	// Sync internal state when selectedVehicle changes externally
	useEffect(() => {
		if (selectedVehicle) {
			setInternalSelection({
				year: selectedVehicle.year,
				makeID: selectedVehicle.makeID,
				makeName: selectedVehicle.make,
				modelID: selectedVehicle.modelID,
				modelName: selectedVehicle.model,
				engineID: selectedVehicle.engineId,
				engineName: selectedVehicle.engineName,
				engineData: selectedVehicle.engineData,
			})
		} else {
			setInternalSelection({})
		}
	}, [selectedVehicle])

	// Fetch base vehicle ID when we have year, make, and model
	const { data: baseVehicleData } = useBaseVehicleQuery(
		{
			year: internalSelection.year!,
			makeID: internalSelection.makeID!,
			modelID: internalSelection.modelID!,
		},
		{
			enabled: !!(internalSelection.year && internalSelection.makeID && internalSelection.modelID),
		}
	)

	// When base vehicle ID is fetched, update the vehicle if selection is complete
	useEffect(() => {
		if (
			baseVehicleData?.baseVehicleId &&
			internalSelection.year &&
			internalSelection.makeID &&
			internalSelection.makeName &&
			internalSelection.modelID &&
			internalSelection.modelName
		) {
			const vehicle: SandboxVehicle = {
				year: internalSelection.year,
				make: internalSelection.makeName,
				model: internalSelection.modelName,
				makeID: internalSelection.makeID,
				modelID: internalSelection.modelID,
				engineId: internalSelection.engineID,
				engineName: internalSelection.engineName,
				engineData: internalSelection.engineData,
				baseVehicleId: baseVehicleData.baseVehicleId,
				...(selectedVehicle && {
					id: selectedVehicle.id,
					motorId: selectedVehicle.motorId,
					vin: selectedVehicle.vin,
					plate: selectedVehicle.plate,
					customerName: selectedVehicle.customerName,
					activeDTCCodes: selectedVehicle.activeDTCCodes,
				}),
			}

			// Only update if baseVehicleId is different to avoid infinite loops
			if (selectedVehicle?.baseVehicleId !== baseVehicleData.baseVehicleId) {
				onVehicleSelect(vehicle)
			}
		}
	}, [baseVehicleData?.baseVehicleId, internalSelection, selectedVehicle, onVehicleSelect])

	// Convert YMMESelection to SandboxVehicle
	const handleYMMEChange = (selection: YMMESelection) => {
		// Update internal state immediately for UI responsiveness
		setInternalSelection(selection)

		// Only call onVehicleSelect when we have complete selection (year, make, model)
		// The baseVehicleId will be populated by the useEffect when the query completes
		if (selection.year && selection.makeID && selection.makeName && selection.modelID && selection.modelName) {
			const vehicle: SandboxVehicle = {
				year: selection.year,
				make: selection.makeName,
				model: selection.modelName,
				makeID: selection.makeID,
				modelID: selection.modelID,
				engineId: selection.engineID,
				engineName: selection.engineName,
				engineData: selection.engineData, // Include full engine data
				// baseVehicleId will be populated by the useEffect when query completes
				// Use existing baseVehicleId if available (from previous query)
				baseVehicleId: baseVehicleData?.baseVehicleId || selectedVehicle?.baseVehicleId,
				// Preserve existing fields
				...(selectedVehicle && {
					id: selectedVehicle.id,
					motorId: selectedVehicle.motorId,
					vin: selectedVehicle.vin,
					plate: selectedVehicle.plate,
					customerName: selectedVehicle.customerName,
					activeDTCCodes: selectedVehicle.activeDTCCodes,
				}),
			}

			onVehicleSelect(vehicle)
		}
	}


	return (
		<YMMESelector
			selection={internalSelection}
			onSelectionChange={handleYMMEChange}
			readOnly={readOnly}
			className={showEngineSelector ? '' : 'hidden'}
		/>
	)
}

