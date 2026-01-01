'use client'

import { useQuery } from '@tanstack/react-query'
import { motorKeys } from './keys'
import type { YearResponse } from '@/lib/integrations/motor-daas/client'

export interface MotorYearsVariables {
	min?: number
	max?: number
	vehicleTypes?: number[]
	withRel?: string[]
}

async function getMotorYears(variables: MotorYearsVariables): Promise<YearResponse[]> {
	const queryParams = new URLSearchParams()
	queryParams.append('AttributeStandard', 'MOTOR')
	
	if (variables.min) queryParams.append('min', variables.min.toString())
	if (variables.max) queryParams.append('max', variables.max.toString())
	if (variables.vehicleTypes?.length) {
		queryParams.append('vehicleTypes', variables.vehicleTypes.join(','))
	}
	if (variables.withRel?.length) {
		queryParams.append('withRel', variables.withRel.join(','))
	}

	const response = await fetch(`/api/motor-daas/vehicles/years?${queryParams.toString()}`)
	
	if (!response.ok) {
		throw new Error(`Failed to fetch years: ${response.statusText}`)
	}

	const data = await response.json()
	if (!data.success) {
		throw new Error(data.message || 'Failed to fetch years')
	}

	return data.data || []
}

export type MotorYearsData = YearResponse[]
export type MotorYearsError = Error

export function useMotorYearsQuery(
	variables: MotorYearsVariables = {},
	options?: {
		enabled?: boolean
		staleTime?: number
	}
) {
	return useQuery<MotorYearsData, MotorYearsError>({
		queryKey: motorKeys.years(variables),
		queryFn: () => getMotorYears(variables),
		enabled: options?.enabled !== false,
		staleTime: options?.staleTime ?? 60 * 1000, // 1 minute default
	})
}

