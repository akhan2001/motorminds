'use client'

import { useQuery } from '@tanstack/react-query'
import { motorKeys } from './keys'
import type { EngineResponse } from '@/lib/integrations/motor-daas/client'

export interface MotorEnginesVariables {
	year: number
	makeID: number
	modelID: number
	vehicleTypes?: number[]
	countryIDs?: number[]
}

async function getMotorEngines(variables: MotorEnginesVariables): Promise<EngineResponse[]> {
	if (!variables.year || !variables.makeID || !variables.modelID) {
		throw new Error('Year, MakeID, and ModelID are required')
	}

	const queryParams = new URLSearchParams()
	queryParams.append('year', variables.year.toString())
	queryParams.append('makeID', variables.makeID.toString())
	queryParams.append('modelID', variables.modelID.toString())
	
	if (variables.vehicleTypes?.length) {
		queryParams.append('vehicleTypes', variables.vehicleTypes.join(','))
	}
	if (variables.countryIDs?.length) {
		queryParams.append('countryIDs', variables.countryIDs.join(','))
	}

	const response = await fetch(`/api/motor-daas/vehicles/engines?${queryParams.toString()}`)
	
	if (!response.ok) {
		throw new Error(`Failed to fetch engines: ${response.statusText}`)
	}

	const data = await response.json()
	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch engines')
	}

	return data.data || []
}

export type MotorEnginesData = EngineResponse[]
export type MotorEnginesError = Error

export function useMotorEnginesQuery(
	variables: MotorEnginesVariables,
	options?: {
		enabled?: boolean
		staleTime?: number
	}
) {
	return useQuery<MotorEnginesData, MotorEnginesError>({
		queryKey: motorKeys.engines(variables.year, variables.makeID, variables.modelID, {
			vehicleTypes: variables.vehicleTypes,
			countryIDs: variables.countryIDs,
		}),
		queryFn: () => getMotorEngines(variables),
		enabled:
			(options?.enabled !== false) &&
			!!variables.year &&
			!!variables.makeID &&
			!!variables.modelID,
		staleTime: options?.staleTime ?? 60 * 1000, // 1 minute default
	})
}

