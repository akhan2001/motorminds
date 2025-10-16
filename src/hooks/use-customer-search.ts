import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Customer, CustomerVehicle } from '@/app/(features)/customers/types'

interface UseCustomerSearchProps {
    searchQuery: string
    enabled?: boolean
}

interface UseCustomerSearchReturn {
    customers: Customer[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
}

export function useCustomerSearch({
    searchQuery,
    enabled = true
}: UseCustomerSearchProps): UseCustomerSearchReturn {
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data: customers = [], isLoading, error, refetch } = useQuery({
        queryKey: ['customers', 'search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return []

            const response = await fetch(`/api/customers?search=${encodeURIComponent(debouncedQuery)}&limit=20`)
            if (!response.ok) {
                throw new Error('Failed to search customers')
            }
            const data = await response.json()
            return data.customers || []
        },
        enabled: enabled && debouncedQuery.trim().length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1
    })

    return {
        customers,
        isLoading,
        error: error as Error | null,
        refetch
    }
}

interface UseCustomerVehiclesProps {
    customerId: string
    enabled?: boolean
}

interface UseCustomerVehiclesReturn {
    vehicles: CustomerVehicle[]
    isLoading: boolean
    error: Error | null
}

export function useCustomerVehicles({
    customerId,
    enabled = true
}: UseCustomerVehiclesProps): UseCustomerVehiclesReturn {
    const { data: vehicles = [], isLoading, error } = useQuery({
        queryKey: ['customers', customerId, 'vehicles'],
        queryFn: async () => {
            const response = await fetch(`/api/customers/${customerId}/vehicles`)
            if (!response.ok) {
                throw new Error('Failed to fetch customer vehicles')
            }
            return response.json()
        },
        enabled: enabled && !!customerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1
    })

    return {
        vehicles,
        isLoading,
        error: error as Error | null
    }
}
