/**
 * Query keys for MOTOR DaaS YMME data
 * Following hierarchical pattern for cache management
 */
export const motorKeys = {
	all: ['motor'] as const,
	years: (options?: { min?: number; max?: number; vehicleTypes?: number[] }) =>
		[...motorKeys.all, 'years', options] as const,
	makes: (year: number, options?: { vehicleTypes?: number[]; withRel?: string[] }) =>
		[...motorKeys.all, 'years', year, 'makes', options] as const,
	models: (
		year: number,
		makeID: number,
		options?: { vehicleTypes?: number[]; countryIDs?: number[]; withRel?: string[] }
	) => [...motorKeys.all, 'years', year, 'makes', makeID, 'models', options] as const,
	engines: (
		year: number,
		makeID: number,
		modelID: number,
		options?: { vehicleTypes?: number[]; countryIDs?: number[] }
	) => [...motorKeys.all, 'years', year, 'makes', makeID, 'models', modelID, 'engines', options] as const,
}

