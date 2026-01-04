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
 * Service Procedure Content Silos (ContentDataType: ServiceProcedures)
 * These are used to filter service procedures by category
 */
export const SERVICE_PROCEDURE_SILOS = {
	AC_HEATER: { id: 1, name: 'A/C & Heater Systems' },
	ACTIVE_SUSPENSION: { id: 3, name: 'Active Suspension Systems' },
	AIR_BAG: { id: 4, name: 'Air Bag Service' },
	ANTI_THEFT: { id: 5, name: 'Anti-Theft/Keyless Entry Procedures' },
	BATTERY: { id: 6, name: 'Battery Replacement Procedures' },
	BRAKE: { id: 8, name: 'Brake Service' },
	CABIN_AIR_FILTER: { id: 10, name: 'Cabin Air Filter Locations & Replacement Procedures' },
	CLUTCH: { id: 11, name: 'Clutch Replacement Procedures' },
	COMPUTER_RELEARN: { id: 13, name: 'Computer Relearn Procedures' },
	DRIVELINE_AXLE: { id: 16, name: 'Driveline & Axle Replacement Procedures' },
	ELECTRICAL: { id: 17, name: 'Electrical Procedures' },
	ESC: { id: 18, name: 'Electronic Stability Control Systems' },
	EMISSION_CONTROL: { id: 19, name: 'Emission Control Systems' },
	ENGINE_MANAGEMENT: { id: 20, name: 'Engine Management Service' },
	ENGINE_SERVICE: { id: 21, name: 'Engine Service' },
	EXHAUST: { id: 22, name: 'Exhaust Procedures' },
	FUEL_FILTER: { id: 23, name: 'Fuel Filter Replacement Procedures' },
	HYBRID: { id: 24, name: 'Hybrid Procedures' },
	INTERIOR_PANEL: { id: 25, name: 'Interior Panel Replacement Procedures' },
	MAINTENANCE_LAMP_RESET: { id: 26, name: 'Maintenance Lamp Reset Procedures' },
	MAINTENANCE: { id: 27, name: 'Maintenance Procedures' },
	RADIATOR_HOSE: { id: 37, name: 'Radiator & Hose Replacement Procedures' },
	SERPENTINE_BELT: { id: 39, name: 'Serpentine Belt Replacement Procedures' },
	STARTER_ALTERNATOR: { id: 40, name: 'Starter & Alternator Replacement Procedures' },
	STEERING_SUSPENSION: { id: 41, name: 'Steering & Suspension Replacement Procedures' },
	TIMING_BELT: { id: 43, name: 'Timing Belt Replacement Procedures' },
	TIMING_CHAIN: { id: 44, name: 'Timing Chain Replacement Procedures' },
	TPMS: { id: 46, name: 'Tire Pressure Monitoring System Procedures' },
	TRANSMISSION: { id: 48, name: 'Transmission Repair' },
	VACUUM_HOSE: { id: 51, name: 'Vacuum Hose Routing' },
	WELDED_PANEL: { id: 115, name: 'Welded Panel Procedures' },
	ADAS: { id: 122, name: 'ADAS' },
} as const

/**
 * All service procedure silo IDs as an array
 */
export const ALL_SERVICE_PROCEDURE_SILO_IDS = Object.values(SERVICE_PROCEDURE_SILOS).map(s => s.id)

/**
 * Standard MOTOR API parameters
 */
export const MOTOR_API_DEFAULTS = {
	ATTRIBUTE_STANDARD: 'MOTOR',
	WIRING_DIAGRAMS_CONTENT_SILO: '56',
	DEFAULT_RESULT_TYPE: 'DrillDown' as const,
	DEFAULT_PAGE_SIZE: 30,
} as const

