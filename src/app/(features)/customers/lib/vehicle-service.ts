// Vehicle service for API interactions
import { createClient } from '@/utils/supabase/client'
import type { CustomerVehicle, VehicleFormData, WalkInVehicleInfo } from '../types/vehicle'
import { normalizeLicensePlate, validateLicensePlate, generateSearchPatterns } from './vehicle-search-utils'

export class VehicleService {
    private static supabase = createClient()

    /**
     * Get all vehicles for a specific customer
     * Uses API endpoint to handle both regular and staging customers
     */
    static async getCustomerVehicles(customerId: string): Promise<CustomerVehicle[]> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        try {
            // Use API endpoint which handles both customer_vehicles and staging_vehicles
            const response = await fetch(`/api/customers/${customerId}/vehicles`)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Failed to fetch vehicles: ${response.statusText}`)
            }

            const vehicles = await response.json()
            return vehicles || []
        } catch (error) {
            console.error('Error fetching customer vehicles:', error)
            throw error instanceof Error ? error : new Error('Failed to fetch vehicles')
        }
    }

    /**
     * Create a new vehicle for a customer
     */
    static async createVehicle(customerId: string, vehicleData: VehicleFormData): Promise<CustomerVehicle> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        const vehiclePayload = {
            customer_id: customerId,
            year: parseInt(vehicleData.year),
            make: vehicleData.make.trim(),
            model: vehicleData.model.trim(),
            vin: vehicleData.vin?.trim() || null,
            license_plate: vehicleData.licensePlate?.trim() || null,
            engine_type: vehicleData.engineType?.trim() || null,
            color: vehicleData.color?.trim() || null,
            mileage: vehicleData.mileage ? parseInt(vehicleData.mileage) : null,
        }

        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .insert([vehiclePayload])
            .select()
            .single()

        if (error) {
            console.error('Error creating vehicle:', error)
            throw new Error(`Failed to create vehicle: ${error.message}`)
        }

        return data
    }

    /**
     * Update an existing vehicle
     */
    static async updateVehicle(vehicleId: string, vehicleData: Partial<VehicleFormData>): Promise<CustomerVehicle> {
        if (!vehicleId) {
            throw new Error('Vehicle ID is required')
        }

        const updatePayload: any = {}
        
        if (vehicleData.year) updatePayload.year = parseInt(vehicleData.year)
        if (vehicleData.make) updatePayload.make = vehicleData.make.trim()
        if (vehicleData.model) updatePayload.model = vehicleData.model.trim()
        if (vehicleData.vin !== undefined) updatePayload.vin = vehicleData.vin?.trim() || null
        if (vehicleData.licensePlate !== undefined) updatePayload.license_plate = vehicleData.licensePlate?.trim() || null
        if (vehicleData.engineType !== undefined) updatePayload.engine_type = vehicleData.engineType?.trim() || null
        if (vehicleData.color !== undefined) updatePayload.color = vehicleData.color?.trim() || null
        if (vehicleData.mileage !== undefined) updatePayload.mileage = vehicleData.mileage ? parseInt(vehicleData.mileage) : null

        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .update(updatePayload)
            .eq('id', vehicleId)
            .select()
            .single()

        if (error) {
            console.error('Error updating vehicle:', error)
            throw new Error(`Failed to update vehicle: ${error.message}`)
        }

        return data
    }

    /**
     * Delete a vehicle
     */
    static async deleteVehicle(vehicleId: string): Promise<void> {
        if (!vehicleId) {
            throw new Error('Vehicle ID is required')
        }

        const { error } = await this.supabase
            .from('customer_vehicles')
            .delete()
            .eq('id', vehicleId)

        if (error) {
            console.error('Error deleting vehicle:', error)
            throw new Error(`Failed to delete vehicle: ${error.message}`)
        }
    }

    /**
     * Get a single vehicle by ID
     */
    static async getVehicle(vehicleId: string): Promise<CustomerVehicle> {
        if (!vehicleId) {
            throw new Error('Vehicle ID is required')
        }

        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .select('*')
            .eq('id', vehicleId)
            .single()

        if (error) {
            console.error('Error fetching vehicle:', error)
            throw new Error(`Failed to fetch vehicle: ${error.message}`)
        }

        return data
    }

    /**
     * Format vehicle for display in dropdowns
     * Handles null values from staging vehicles
     */
    static formatVehicleDisplay(vehicle: CustomerVehicle): string {
        const parts = [
            vehicle.year || 'Unknown Year',
            vehicle.make || 'Unknown Make',
            vehicle.model || 'Unknown Model'
        ].filter(Boolean)
        
        const yearMakeModel = parts.join(' ')
        const licensePlate = vehicle.license_plate ? ` (${vehicle.license_plate})` : ''
        const vin = !vehicle.license_plate && vehicle.vin ? ` (VIN: ${vehicle.vin.slice(-6)})` : ''
        
        return `${yearMakeModel}${licensePlate}${vin}`.trim() || 'Incomplete Vehicle Info'
    }

    /**
     * Convert CustomerVehicle to VehicleOption for dropdowns
     */
    static toVehicleOption(vehicle: CustomerVehicle): import('../types/vehicle').VehicleOption {
        return {
            id: vehicle.id,
            displayName: this.formatVehicleDisplay(vehicle),
            year: vehicle.year || undefined,
            make: vehicle.make || undefined,
            model: vehicle.model || undefined,
            licensePlate: vehicle.license_plate || undefined,
            color: vehicle.color || undefined,
            vin: vehicle.vin || undefined,
        }
    }

    /**
     * Search vehicles by license plate (simple version without shop filtering for debugging)
     */
    static async searchVehiclesByPlateSimple(query: string, limit: number = 10): Promise<CustomerVehicle[]> {
        if (!query || query.trim().length === 0) {
            return []
        }

        try {
            const normalizedQuery = normalizeLicensePlate(query)
            console.log('Simple search for normalized query:', normalizedQuery)
            
            const { data, error } = await this.supabase
                .from('customer_vehicles')
                .select('*')
                .ilike('license_plate', normalizedQuery)
                .limit(limit)

            if (error) {
                console.error('Error in simple search:', error)
                throw new Error(`Failed to search vehicles: ${error.message}`)
            }

            console.log('Simple search results:', data?.length || 0)
            return data || []
        } catch (error) {
            console.error('Error in simple vehicle search:', error)
            throw error instanceof Error ? error : new Error('Failed to search vehicles')
        }
    }

    /**
     * Search vehicles by license plate using API route
     * Supports fuzzy matching and partial searches
     * Only returns vehicles that belong to customers of the specified shop, or walk-in vehicles (customer_id = null)
     */
    static async searchVehiclesByPlate(query: string, shopId: string, limit: number = 10): Promise<CustomerVehicle[]> {
        if (!query || query.trim().length === 0) {
            return []
        }

        if (!shopId) {
            throw new Error('Shop ID is required for vehicle search')
        }

        try {
            console.log('Searching vehicles via API:', query, 'shop:', shopId)
            
            const searchParams = new URLSearchParams({
                q: query,
                limit: limit.toString()
            })

            const response = await fetch(`/api/customers/vehicles/search?${searchParams}`)
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Search failed: ${response.statusText}`)
            }

            const data = await response.json()
            console.log('API search results:', data.vehicles?.length || 0)
            
            return data.vehicles || []
        } catch (error) {
            console.error('Error searching vehicles by plate:', error)
            throw error instanceof Error ? error : new Error('Failed to search vehicles')
        }
    }

    /**
     * Create a walk-in vehicle (no customer association)
     */
    static async createWalkInVehicle(vehicleData: WalkInVehicleInfo): Promise<CustomerVehicle> {
        // Validate license plate
        const plateValidation = validateLicensePlate(vehicleData.license_plate)
        if (!plateValidation.isValid) {
            throw new Error(plateValidation.error || 'Invalid license plate')
        }

        const vehiclePayload = {
            customer_id: null, // Walk-in vehicle has no customer association
            year: vehicleData.year ? vehicleData.year.toString() : null, // Convert to string to match DB schema
            make: vehicleData.make.trim(),
            model: vehicleData.model.trim(),
            vin: vehicleData.vin?.trim() || null,
            license_plate: normalizeLicensePlate(vehicleData.license_plate),
            color: vehicleData.color?.trim() || null,
            mileage: vehicleData.mileage || null,
            engine_type: null, // Not provided in walk-in form
        }

        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .insert([vehiclePayload])
            .select()
            .single()

        if (error) {
            console.error('Error creating walk-in vehicle:', error)
            throw new Error(`Failed to create vehicle: ${error.message}`)
        }

        return data
    }

    /**
     * Check if a license plate already exists within the shop's scope
     * Useful for preventing duplicates
     * Only checks vehicles that belong to customers of the specified shop, or walk-in vehicles
     */
    static async checkPlateExists(licensePlate: string, shopId: string): Promise<boolean> {
        if (!licensePlate) return false
        if (!shopId) return false

        try {
            // Use the search API to check if plate exists
            const results = await this.searchVehiclesByPlate(licensePlate, shopId, 1)
            return results.length > 0
        } catch (error) {
            console.error('Error checking plate existence:', error)
            return false
        }
    }

    /**
     * Normalize license plate for consistent storage
     */
    static normalizePlate(plate: string): string {
        return normalizeLicensePlate(plate)
    }
}
