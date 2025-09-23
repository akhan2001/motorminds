// Vehicle service for API interactions
import { createClient } from '@/utils/supabase/client'
import type { CustomerVehicle, VehicleFormData } from '../types/vehicle'

export class VehicleService {
    private static supabase = createClient()

    /**
     * Get all vehicles for a specific customer
     */
    static async getCustomerVehicles(customerId: string): Promise<CustomerVehicle[]> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        const { data, error } = await this.supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching customer vehicles:', error)
            throw new Error(`Failed to fetch vehicles: ${error.message}`)
        }

        return data || []
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
     */
    static formatVehicleDisplay(vehicle: CustomerVehicle): string {
        const yearMakeModel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        const licensePlate = vehicle.license_plate ? ` (${vehicle.license_plate})` : ''
        return `${yearMakeModel}${licensePlate}`
    }

    /**
     * Convert CustomerVehicle to VehicleOption for dropdowns
     */
    static toVehicleOption(vehicle: CustomerVehicle): import('../types/vehicle').VehicleOption {
        return {
            id: vehicle.id,
            displayName: this.formatVehicleDisplay(vehicle),
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.license_plate || undefined,
            color: vehicle.color || undefined,
            vin: vehicle.vin || undefined,
        }
    }
}
