/**
 * Base Vehicle Query Hook
 * Fetches the BaseVehicleID for a YMME selection from MOTOR DaaS
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { motorKeys } from './keys'

interface BaseVehicleVariables {
	year: number
	makeID: number
	modelID: number
}

interface BaseVehicleResponse {
	success: boolean
	data?: {
		BaseVehicleID: number
		Year: number
		Make: { MakeID: number; MakeName: string }
		Model: { ModelID: number; ModelName: string }
	}
	baseVehicleId?: number
	message?: string
	error?: string
}

async function fetchBaseVehicle(variables: BaseVehicleVariables): Promise<BaseVehicleResponse> {
	const queryParams = new URLSearchParams({
		year: variables.year.toString(),
		makeID: variables.makeID.toString(),
		modelID: variables.modelID.toString(),
	})

	const response = await fetch(`/api/motor-daas/vehicles/base-vehicle?${queryParams}`)

	if (!response.ok) {
		throw new Error(`Failed to fetch base vehicle: ${response.statusText}`)
	}

	return response.json()
}

export function useBaseVehicleQuery(
	variables: BaseVehicleVariables,
	options?: Omit<UseQueryOptions<BaseVehicleResponse, Error>, 'queryKey' | 'queryFn'>
) {
	return useQuery<BaseVehicleResponse, Error>({
		queryKey: motorKeys.baseVehicle(
			variables.year,
			variables.makeID,
			variables.modelID
		),
		queryFn: () => fetchBaseVehicle(variables),
		staleTime: 1000 * 60 * 60, // 1 hour - base vehicle IDs don't change
		...options,
	})
}

