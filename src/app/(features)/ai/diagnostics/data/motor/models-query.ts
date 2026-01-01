'use client'

import { useQuery } from '@tanstack/react-query'
import { motorKeys } from './keys'
import type { ModelResponse } from '@/lib/integrations/motor-daas/client'

export interface MotorModelsVariables {
	year: number
	makeID: number
	vehicleTypes?: number[]
	countryIDs?: number[]
	withRel?: string[]
}

async function getMotorModels(variables: MotorModelsVariables): Promise<ModelResponse[]> {
	if (!variables.year || !variables.makeID) {
		throw new Error('Year and MakeID are required')
	}

	const queryParams = new URLSearchParams()
	queryParams.append('year', variables.year.toString())
	queryParams.append('makeID', variables.makeID.toString())
	
	if (variables.vehicleTypes?.length) {
		queryParams.append('vehicleTypes', variables.vehicleTypes.join(','))
	}
	if (variables.countryIDs?.length) {
		queryParams.append('countryIDs', variables.countryIDs.join(','))
	}
	if (variables.withRel?.length) {
		queryParams.append('withRel', variables.withRel.join(','))
	}

	const response = await fetch(`/api/motor-daas/vehicles/models?${queryParams.toString()}`)
	
	if (!response.ok) {
		throw new Error(`Failed to fetch models: ${response.statusText}`)
	}

	const data = await response.json()
	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch models')
	}

	return data.data || []
}

export type MotorModelsData = ModelResponse[]
export type MotorModelsError = Error

export function useMotorModelsQuery(
	variables: MotorModelsVariables,
	options?: {
		enabled?: boolean
		staleTime?: number
	}
) {
	return useQuery<MotorModelsData, MotorModelsError>({
		queryKey: motorKeys.models(variables.year, variables.makeID, {
			vehicleTypes: variables.vehicleTypes,
			countryIDs: variables.countryIDs,
			withRel: variables.withRel,
		}),
		queryFn: () => getMotorModels(variables),
		enabled: (options?.enabled !== false) && !!variables.year && !!variables.makeID,
		staleTime: options?.staleTime ?? 60 * 1000, // 1 minute default
	})
}

