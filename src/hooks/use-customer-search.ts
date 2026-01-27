import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Customer, CustomerVehicle } from '@/app/(features)/customers/types'

interface UseCustomerSearchProps {
    searchQuery: string
    enabled?: boolean
    organizationWide?: boolean
}

interface UseCustomerSearchReturn {
    customers: (Customer & { 
        isFromCurrentShop?: boolean
        shopName?: string 
    })[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
    isOrganizationSearch?: boolean
}

export function useCustomerSearch({
    searchQuery,
    enabled = true,
    organizationWide = false
}: UseCustomerSearchProps): UseCustomerSearchReturn {
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['customers', 'search', debouncedQuery, organizationWide],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return { customers: [], isOrganizationSearch: false }

            const params = new URLSearchParams({
                q: debouncedQuery,
                limit: '20'
            })
            
            if (organizationWide) {
                params.append('organization', 'true')
            }

            const response = await fetch(`/api/customers/search?${params}`)
            if (!response.ok) {
                throw new Error('Failed to search customers')
            }
            const responseData = await response.json()
            return {
                customers: responseData.customers || [],
                isOrganizationSearch: responseData.isOrganizationSearch || false
            }
        },
        enabled: enabled && debouncedQuery.trim().length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1
    })

    return {
        customers: data?.customers || [],
        isLoading,
        error: error as Error | null,
        refetch,
        isOrganizationSearch: data?.isOrganizationSearch
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

// Hook for fetching recent customers (based on recent work orders/invoices)
interface UseRecentCustomersProps {
    enabled?: boolean
    limit?: number
}

interface UseRecentCustomersReturn {
    customers: (Customer & { lastActivity?: string })[]
    isLoading: boolean
    error: Error | null
    refetch: () => void
}

export function useRecentCustomers({
    enabled = true,
    limit = 10
}: UseRecentCustomersProps = {}): UseRecentCustomersReturn {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['customers', 'recent', limit],
        queryFn: async () => {
            const params = new URLSearchParams({
                limit: limit.toString()
            })
            
            const response = await fetch(`/api/customers/recent?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch recent customers')
            }
            return response.json()
        },
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes - recent data changes more frequently
        retry: 1
    })

    return {
        customers: data?.customers || [],
        isLoading,
        error: error as Error | null,
        refetch
    }
}
