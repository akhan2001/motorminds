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
 * Explicit keyword mapping for service procedure categories
 * Following Supabase pattern: explicit mappings over fuzzy matching
 */
export const SERVICE_PROCEDURE_KEYWORD_MAP: Record<string, number> = {
	// Maintenance Procedures (id: 27)
	'oil change': 27,
	'oil': 27,
	'lube': 27,
	'lubrication': 27,
	'fluid change': 27,
	'fluid service': 27,
	'maintenance': 27,
	'service': 27,
	'oil service': 27,
	'engine oil': 27,
	'transmission fluid': 27,
	'coolant change': 27,
	'brake fluid': 27,
	
	// Battery Replacement (id: 6)
	'battery': 6,
	'battery replacement': 6,
	
	// Brake Service (id: 8)
	'brake': 8,
	'brake pads': 8,
	'brake service': 8,
	'brake replacement': 8,
	'brake disc': 8,
	'brake rotor': 8,
	
	// Timing Chain (id: 44)
	'timing chain': 44,
	'chain': 44,
	
	// Timing Belt (id: 43)
	'timing belt': 43,
	'cam belt': 43,
	
	// Transmission (id: 48)
	'transmission': 48,
	'trans': 48,
	
	// Engine Service (id: 21)
	'engine': 21,
	'engine service': 21,
	'engine repair': 21,
	
	// A/C & Heater (id: 1)
	'ac': 1,
	'heater': 1,
	'air conditioning': 1,
	'climate control': 1,
	
	// Starter & Alternator (id: 40)
	'starter': 40,
	'alternator': 40,
	
	// Serpentine Belt (id: 39)
	'serpentine belt': 39,
	'drive belt': 39,
	'accessory belt': 39,
	
	// Clutch (id: 11)
	'clutch': 11,
	
	// Fuel Filter (id: 23)
	'fuel filter': 23,
	
	// Cabin Air Filter (id: 10)
	'cabin air filter': 10,
	'cabin filter': 10,
	
	// Radiator & Hose (id: 37)
	'radiator': 37,
	'hose': 37,
	'cooling system': 37,
	
	// Steering & Suspension (id: 41)
	'steering': 41,
	'suspension': 41,
	'struts': 41,
	'shocks': 41,
	
	// Exhaust (id: 22)
	'exhaust': 22,
	'muffler': 22,
	'catalytic converter': 22,
	
	// Electrical (id: 17)
	'electrical': 17,
	'wiring': 17,
	
	// Air Bag (id: 4)
	'airbag': 4,
	'air bag': 4,
	'srs': 4,
	
	// TPMS (id: 46)
	'tpms': 46,
	'tire pressure': 46,
	'pressure monitoring': 46,
}

/**
 * Wiring Diagram Subject Categories (from MOTOR API taxonomy)
 * These are the MOTOR API subject IDs and names for wiring diagrams
 */
export const WIRING_DIAGRAM_SUBJECTS = {
	BODY_ACCESSORIES: { id: 1, name: 'Body & Accessories' },
	BRAKES: { id: 2, name: 'Brakes' },
	ELECTRICAL_DISTRIBUTION: { id: 4, name: 'Electrical Distribution' },
	ENGINE: { id: 5, name: 'Engine' },
	HVAC: { id: 6, name: 'HVAC' },
	INTERIOR_DRIVER_AMENITY: { id: 7, name: 'Interior & Driver Amenity' },
	INTERIOR_SWITCH: { id: 8, name: 'Interior Switch' },
	LIGHTING: { id: 9, name: 'Lighting' },
	RESTRAINTS: { id: 12, name: 'Restraints' },
	STEERING: { id: 13, name: 'Steering' },
	TRANSMISSION_TRANSAXLE: { id: 16, name: 'Transmission/Transaxle' },
	WARNING_SYSTEMS: { id: 17, name: 'Warning Systems' },
} as const

/**
 * Explicit keyword mapping for wiring diagram subjects
 * Maps common search terms to MOTOR API subject IDs
 */
export const WIRING_DIAGRAM_KEYWORD_MAP: Record<string, number> = {
	// Lighting (id: 9)
	'headlight': 9,
	'headlights': 9,
	'headlamp': 9,
	'headlamps': 9,
	'tail light': 9,
	'taillight': 9,
	'taillights': 9,
	'brake light': 9,
	'turn signal': 9,
	'blinker': 9,
	'fog light': 9,
	'fog lamp': 9,
	'daytime running': 9,
	'drl': 9,
	'parking light': 9,
	'marker light': 9,
	'interior light': 9,
	'dome light': 9,
	'courtesy light': 9,
	'map light': 9,
	'backup light': 9,
	'reverse light': 9,
	'license plate light': 9,
	'lighting': 9,
	'light': 9,
	'lights': 9,
	'lamp': 9,
	'lamps': 9,
	
	// Engine (id: 5)
	'engine': 5,
	'motor': 5,
	'fuel injection': 5,
	'ignition': 5,
	'spark plug': 5,
	'coil': 5,
	'injector': 5,
	'throttle': 5,
	'camshaft': 5,
	'crankshaft': 5,
	'oil pressure': 5,
	'coolant': 5,
	'water pump': 5,
	'thermostat': 5,
	'timing': 5,
	'variable valve': 5,
	'vvt': 5,
	'vtec': 5,
	
	// Brakes (id: 2)
	'brake': 2,
	'brakes': 2,
	'abs': 2,
	'antilock': 2,
	'anti-lock': 2,
	'brake pedal': 2,
	'brake switch': 2,
	'brake sensor': 2,
	'wheel speed': 2,
	
	// Electrical Distribution (id: 4)
	'fuse': 4,
	'fuse box': 4,
	'relay': 4,
	'junction': 4,
	'power distribution': 4,
	'electrical distribution': 4,
	'battery': 4,
	'alternator': 4,
	'starter': 4,
	'ground': 4,
	'charging': 4,
	'starting': 4,
	
	// HVAC (id: 6)
	'hvac': 6,
	'heater': 6,
	'air conditioning': 6,
	'a/c': 6,
	'ac': 6,
	'climate': 6,
	'blower': 6,
	'blower motor': 6,
	'compressor': 6,
	'evaporator': 6,
	'condenser': 6,
	'defroster': 6,
	'defrost': 6,
	
	// Body & Accessories (id: 1)
	'body': 1,
	'door': 1,
	'window': 1,
	'power window': 1,
	'door lock': 1,
	'power lock': 1,
	'mirror': 1,
	'side mirror': 1,
	'wiper': 1,
	'washer': 1,
	'horn': 1,
	'trunk': 1,
	'liftgate': 1,
	'sunroof': 1,
	'moonroof': 1,
	'convertible': 1,
	
	// Interior & Driver Amenity (id: 7)
	'seat': 7,
	'power seat': 7,
	'heated seat': 7,
	'seat heater': 7,
	'steering wheel': 7,
	'cruise control': 7,
	'cruise': 7,
	'keyless': 7,
	'remote start': 7,
	'push button start': 7,
	'immobilizer': 7,
	
	// Interior Switch (id: 8)
	'switch': 8,
	'multifunction switch': 8,
	'combination switch': 8,
	'column switch': 8,
	'dash switch': 8,
	
	// Transmission/Transaxle (id: 16)
	'transmission': 16,
	'transaxle': 16,
	'automatic': 16,
	'manual transmission': 16,
	'shift': 16,
	'shifter': 16,
	'gear': 16,
	'neutral safety': 16,
	'range sensor': 16,
	
	// Steering (id: 13)
	'steering': 13,
	'power steering': 13,
	'eps': 13,
	'electric power steering': 13,
	
	// Restraints (id: 12)
	'airbag': 12,
	'air bag': 12,
	'srs': 12,
	'seatbelt': 12,
	'seat belt': 12,
	'restraint': 12,
	'restraints': 12,
	'crash sensor': 12,
	'impact sensor': 12,
	'pretensioner': 12,
	
	// Warning Systems (id: 17)
	'warning': 17,
	'gauge': 17,
	'speedometer': 17,
	'tachometer': 17,
	'instrument cluster': 17,
	'cluster': 17,
	'dash': 17,
	'dashboard': 17,
	'indicator': 17,
	'tpms': 17,
	'tire pressure': 17,
}

/**
 * Standard MOTOR API parameters
 */
export const MOTOR_API_DEFAULTS = {
	ATTRIBUTE_STANDARD: 'MOTOR',
	WIRING_DIAGRAMS_CONTENT_SILO: '56',
	DEFAULT_RESULT_TYPE: 'DrillDown' as const,
	DEFAULT_PAGE_SIZE: 30,
} as const

