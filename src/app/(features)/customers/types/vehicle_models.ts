'use client'

// Thin TypeScript wrapper around the canonical vehicle models JSON.
// We use a dynamic import to avoid needing JSON module type declarations.

type VehicleModelsJsonEntry = {
    brand: string
    models: string[]
}

let VEHICLE_MODELS_BY_MAKE_CACHE: Record<string, string[]> | null = null

function loadVehicleModelsSync(): Record<string, string[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const vehicleModelsJson = require('../../../../../data/vehicles/vehicle-models.json') as VehicleModelsJsonEntry[]
    return vehicleModelsJson.reduce((acc, entry) => {
        acc[entry.brand] = entry.models
        return acc
    }, {} as Record<string, string[]>)
}

export const VEHICLE_MODELS_BY_MAKE: Record<string, string[]> = (() => {
    if (!VEHICLE_MODELS_BY_MAKE_CACHE) {
        VEHICLE_MODELS_BY_MAKE_CACHE = loadVehicleModelsSync()
    }
    return VEHICLE_MODELS_BY_MAKE_CACHE
})()

/**
 * Get canonical list of models for a make.
 * Case‑insensitive on the make name; returns [] if unknown.
 */
export function getModelsForMake(make?: string | null): string[] {
    if (!make) return []

    const entryKey = Object.keys(VEHICLE_MODELS_BY_MAKE).find(
        (brand) => brand.toLowerCase() === make.toLowerCase()
    )

    if (!entryKey) return []
    return VEHICLE_MODELS_BY_MAKE[entryKey]
}

/**
 * Normalize a raw model string to the canonical spelling for a make.
 * - If it matches a known model (case‑insensitive), returns the canonical model from JSON.
 * - Otherwise, returns a simple title‑cased version of the raw input.
 */
export function normalizeModel(make: string, rawModel: string): string {
    if (!rawModel) return ''

    const models = getModelsForMake(make)
    const lowerRaw = rawModel.toLowerCase().trim()

    const match = models.find((m) => m.toLowerCase() === lowerRaw)
    if (match) return match

    // Fallback: basic title‑case of whatever the user typed
    return rawModel
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}


