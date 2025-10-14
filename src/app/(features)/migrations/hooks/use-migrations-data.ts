import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/core/useAuth'
import { migrationsService, StagingSummary, StagingCustomer, StagingVehicle, StagingInvoice, StagingFilters } from '../lib/migrations-service'

export function useMigrationsData() {
    const { shopId, isLoading: authLoading } = useAuth()

    const summaryQuery = useQuery<StagingSummary>({
        queryKey: ['migrations-summary', shopId],
        queryFn: () => migrationsService.getStagingSummary(shopId!),
        enabled: !!shopId && !authLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    return {
        summary: summaryQuery.data,
        summaryLoading: summaryQuery.isLoading,
        summaryError: summaryQuery.error,
        refetchSummary: summaryQuery.refetch,
    }
}

export function useStagingCustomers(filters: StagingFilters = {}) {
    const { shopId, isLoading: authLoading } = useAuth()

    return useQuery<StagingCustomer[]>({
        queryKey: ['staging-customers', shopId, filters],
        queryFn: () => migrationsService.getStagingCustomers(shopId!, filters),
        enabled: !!shopId && !authLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

export function useStagingVehicles(filters: StagingFilters = {}) {
    const { shopId, isLoading: authLoading } = useAuth()

    return useQuery<StagingVehicle[]>({
        queryKey: ['staging-vehicles', shopId, filters],
        queryFn: () => migrationsService.getStagingVehicles(shopId!, filters),
        enabled: !!shopId && !authLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

export function useStagingInvoices(filters: StagingFilters = {}) {
    const { shopId, isLoading: authLoading } = useAuth()

    return useQuery<StagingInvoice[]>({
        queryKey: ['staging-invoices', shopId, filters],
        queryFn: () => migrationsService.getStagingInvoices(shopId!, filters),
        enabled: !!shopId && !authLoading,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}
