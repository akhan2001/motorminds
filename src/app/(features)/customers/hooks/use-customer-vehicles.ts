// React hook for managing customer vehicles
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VehicleService } from '../lib/vehicle-service'
import type { CustomerVehicle, VehicleFormData } from '../types/vehicle'
import { toast } from 'sonner'

// Query keys for caching
export const vehicleKeys = {
    all: ['vehicles'] as const,
    customer: (customerId: string) => [...vehicleKeys.all, 'customer', customerId] as const,
    vehicle: (vehicleId: string) => [...vehicleKeys.all, 'vehicle', vehicleId] as const,
}

/**
 * Hook to fetch vehicles for a specific customer
 */
export function useCustomerVehicles(customerId: string) {
    return useQuery({
        queryKey: vehicleKeys.customer(customerId),
        queryFn: () => VehicleService.getCustomerVehicles(customerId),
        enabled: !!customerId && customerId !== 'new',
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to fetch a single vehicle
 */
export function useVehicle(vehicleId: string) {
    return useQuery({
        queryKey: vehicleKeys.vehicle(vehicleId),
        queryFn: () => VehicleService.getVehicle(vehicleId),
        enabled: !!vehicleId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook to create a new vehicle
 */
export function useCreateVehicle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ customerId, vehicleData }: { customerId: string; vehicleData: VehicleFormData }) =>
            VehicleService.createVehicle(customerId, vehicleData),
        onSuccess: (newVehicle) => {
            // Invalidate and refetch customer vehicles
            queryClient.invalidateQueries({ queryKey: vehicleKeys.customer(newVehicle.customer_id) })
            
            // Add the new vehicle to the cache
            queryClient.setQueryData(vehicleKeys.vehicle(newVehicle.id), newVehicle)
            
            toast.success('Vehicle created successfully')
        },
        onError: (error: Error) => {
            console.error('Error creating vehicle:', error)
            toast.error(`Failed to create vehicle: ${error.message}`)
        },
    })
}

/**
 * Hook to update a vehicle
 */
export function useUpdateVehicle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ vehicleId, vehicleData }: { vehicleId: string; vehicleData: Partial<VehicleFormData> }) =>
            VehicleService.updateVehicle(vehicleId, vehicleData),
        onSuccess: (updatedVehicle) => {
            // Update the vehicle in cache
            queryClient.setQueryData(vehicleKeys.vehicle(updatedVehicle.id), updatedVehicle)
            
            // Invalidate customer vehicles to refresh the list
            queryClient.invalidateQueries({ queryKey: vehicleKeys.customer(updatedVehicle.customer_id) })
            
            toast.success('Vehicle updated successfully')
        },
        onError: (error: Error) => {
            console.error('Error updating vehicle:', error)
            toast.error(`Failed to update vehicle: ${error.message}`)
        },
    })
}

/**
 * Hook to delete a vehicle
 */
export function useDeleteVehicle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: VehicleService.deleteVehicle,
        onSuccess: (_, vehicleId) => {
            // Remove the vehicle from cache
            queryClient.removeQueries({ queryKey: vehicleKeys.vehicle(vehicleId) })
            
            // Invalidate all customer vehicles queries to refresh lists
            queryClient.invalidateQueries({ queryKey: vehicleKeys.all })
            
            toast.success('Vehicle deleted successfully')
        },
        onError: (error: Error) => {
            console.error('Error deleting vehicle:', error)
            toast.error(`Failed to delete vehicle: ${error.message}`)
        },
    })
}
