import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VehicleService } from '@/app/(features)/customers/lib/vehicle-service'
import type { CustomerVehicle, WalkInVehicleInfo } from '@/app/(features)/customers/types/vehicle'
import { toast } from 'sonner'

/**
 * Hook for searching vehicles by license plate
 */
export function useVehicleSearch(query: string, shopId: string, options?: { enabled?: boolean; limit?: number }) {
    return useQuery({
        queryKey: ['vehicles', 'search', query, shopId],
        queryFn: () => VehicleService.searchVehiclesByPlate(query, shopId, options?.limit),
        enabled: (options?.enabled ?? true) && query.trim().length > 0 && !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })
}

/**
 * Hook for creating a walk-in vehicle
 */
export function useCreateWalkInVehicle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (vehicleData: WalkInVehicleInfo) => VehicleService.createWalkInVehicle(vehicleData),
        onSuccess: (data: CustomerVehicle) => {
            // Invalidate vehicle search queries to include the new vehicle
            queryClient.invalidateQueries({ queryKey: ['vehicles', 'search'] })
            
            toast.success('Vehicle saved to database', {
                description: `${data.year} ${data.make} ${data.model} (${data.license_plate})`
            })
        },
        onError: (error: Error) => {
            console.error('Failed to create walk-in vehicle:', error)
            toast.error('Failed to save vehicle', {
                description: error.message
            })
        }
    })
}

/**
 * Hook for checking if a license plate exists
 */
export function useCheckPlateExists(licensePlate: string, shopId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['vehicles', 'plate-exists', licensePlate, shopId],
        queryFn: () => VehicleService.checkPlateExists(licensePlate, shopId),
        enabled: (options?.enabled ?? true) && licensePlate.trim().length > 0 && !!shopId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook for debounced vehicle search
 * Automatically debounces the search query to avoid excessive API calls
 */
export function useDebouncedVehicleSearch(query: string, shopId: string, debounceMs: number = 300) {
    const [debouncedQuery, setDebouncedQuery] = React.useState(query)

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [query, debounceMs])

    return useVehicleSearch(debouncedQuery, shopId, {
        enabled: debouncedQuery.trim().length > 1 // Only search with 2+ characters
    })
}

