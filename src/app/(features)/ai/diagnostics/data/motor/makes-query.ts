'use client'

import { useQuery } from '@tanstack/react-query'
import { motorKeys } from './keys'
import type { MakeResponse } from '@/lib/integrations/motor-daas/client'

export interface MotorMakesVariables {
	year: number
	vehicleTypes?: number[]
	withRel?: string[]
}

async function getMotorMakes(variables: MotorMakesVariables): Promise<MakeResponse[]> {
	if (!variables.year) {
		throw new Error('Year is required')
	}

	const queryParams = new URLSearchParams()
	queryParams.append('year', variables.year.toString())
	
	if (variables.vehicleTypes?.length) {
		queryParams.append('vehicleTypes', variables.vehicleTypes.join(','))
	}
	if (variables.withRel?.length) {
		queryParams.append('withRel', variables.withRel.join(','))
	}

	const response = await fetch(`/api/motor-daas/vehicles/makes?${queryParams.toString()}`)
	
	if (!response.ok) {
		throw new Error(`Failed to fetch makes: ${response.statusText}`)
	}

	const data = await response.json()
	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch makes')
	}

	return data.data || []
}

export type MotorMakesData = MakeResponse[]
export type MotorMakesError = Error

export function useMotorMakesQuery(
	variables: MotorMakesVariables,
	options?: {
		enabled?: boolean
		staleTime?: number
	}
) {
	return useQuery<MotorMakesData, MotorMakesError>({
		queryKey: motorKeys.makes(variables.year, {
			vehicleTypes: variables.vehicleTypes,
			withRel: variables.withRel,
		}),
		queryFn: () => getMotorMakes(variables),
		enabled: (options?.enabled !== false) && !!variables.year,
		staleTime: options?.staleTime ?? 60 * 1000, // 1 minute default
	})
}

