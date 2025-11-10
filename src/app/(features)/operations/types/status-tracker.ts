// Status tracker stored in work_orders.status_tracker JSONB
export interface StatusTracker {
    name: string
    color: string // Hex color (e.g., '#3B82F6')
}

// Status tracker preset stored in shops.status_tracker_presets JSONB
export interface StatusTrackerPreset {
    id: string // UUID generated client-side
    name: string
    color: string // Hex color
    display_order?: number
}

// For creating/updating presets
export interface StatusTrackerPresetCreateData {
    name: string
    color: string
    display_order?: number
}

