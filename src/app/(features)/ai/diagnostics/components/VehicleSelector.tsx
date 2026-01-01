'use client'

import React, { useState, useEffect } from 'react'
import { YMMESelector, type YMMESelection } from './YMMESelector'

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
			})
		} else {
			setInternalSelection({})
		}
	}, [selectedVehicle])

	// Convert YMMESelection to SandboxVehicle
	const handleYMMEChange = (selection: YMMESelection) => {
		// Update internal state immediately for UI responsiveness
		setInternalSelection(selection)

		// Only call onVehicleSelect when we have complete selection (year, make, model)
		if (selection.year && selection.makeID && selection.makeName && selection.modelID && selection.modelName) {
			const vehicle: SandboxVehicle = {
				year: selection.year,
				make: selection.makeName,
				model: selection.modelName,
				makeID: selection.makeID,
				modelID: selection.modelID,
				engineId: selection.engineID,
				engineName: selection.engineName,
				// Use modelID as baseVehicleId for now (may need lookup later)
				baseVehicleId: selection.modelID,
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

