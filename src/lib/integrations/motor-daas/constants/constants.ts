/**
 * Default vehicle IDs (for development/testing)
 * TODO: Remove hardcoded values, get from context
 */
export const DEFAULT_BASE_VEHICLE_ID = 22124 // 2010 Honda Civic
export const DEFAULT_ENGINE_ID = 2913 // 1.8L L4

/**
 * Content type values for MOTOR DaaS API
 */
export const CONTENT_TYPES = {
	WIRING_DIAGRAMS: 'WiringDiagrams',
	SERVICE_PROCEDURES: 'ServiceProcedures',
	OEM_COMPONENTS: 'OEMComponents',
} as const

/**
 * Standard MOTOR API parameters
 */
export const MOTOR_API_DEFAULTS = {
	ATTRIBUTE_STANDARD: 'MOTOR',
	WIRING_DIAGRAMS_CONTENT_SILO: '56',
	DEFAULT_RESULT_TYPE: 'DrillDown' as const,
	DEFAULT_PAGE_SIZE: 30,
} as const

