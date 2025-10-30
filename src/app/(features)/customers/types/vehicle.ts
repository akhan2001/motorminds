// Customer vehicle types

export interface CustomerVehicle {
    id: string
    customer_id: string
    year: number | null // Allow null for staging vehicles
    make: string | null // Allow null for staging vehicles
    model: string | null // Allow null for staging vehicles
    vin?: string | null
    license_plate?: string | null
    engine_type?: string | null
    color?: string | null
    mileage?: number | null
    created_at: string
}

export interface VehicleOption {
    id: string
    displayName: string // "2015 Honda Civic (ABC123)"
    year?: number // Optional for staging vehicles
    make?: string // Optional for staging vehicles
    model?: string // Optional for staging vehicles
    licensePlate?: string
    color?: string
    vin?: string
}

export interface VehicleDropdownProps {
    customerId: string
    selectedVehicleId: string
    onVehicleSelect: (vehicleId: string, vehicleData?: VehicleOption) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    isLoading?: boolean
    refreshTrigger?: number // Add this to force refresh when a new vehicle is created
}

export interface VehicleFormData {
    year: string
    make: string
    model: string
    vin?: string
    licensePlate?: string
    engineType?: string
    color?: string
    mileage?: string
}

// Common vehicle makes for dropdowns
export const VEHICLE_MAKES = [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge',
    'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Land Rover',
    'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Porsche',
    'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
]

// Vehicle types for better categorization
export type VehicleType = 'sedan' | 'suv' | 'truck' | 'hatchback' | 'coupe' | 'convertible' | 'wagon' | 'van' | 'motorcycle' | 'other'

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Truck' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'coupe', label: 'Coupe' },
    { value: 'convertible', label: 'Convertible' },
    { value: 'wagon', label: 'Wagon' },
    { value: 'van', label: 'Van' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'other', label: 'Other' },
]

export interface WalkInVehicleInfo {
    year: number
    make: string
    model: string
    license_plate: string
    color?: string
    vin?: string
    mileage?: number
}