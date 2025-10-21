import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { stagingInvoicesService } from '../lib/staging-invoices-service'
import { StagingInvoice, StagingCustomer } from '../types/staging-invoices'

// Hook to search staging customers
export function useStagingCustomerSearch(searchQuery: string, shopId?: string) {
    return useQuery({
        queryKey: ['staging-customers-search', searchQuery, shopId],
        queryFn: () => stagingInvoicesService.searchStagingCustomers(searchQuery, shopId),
        enabled: searchQuery.trim().length > 0,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

// Hook to get staging invoices for a specific customer
export function useStagingInvoicesByCustomer(customerId: string) {
    return useQuery({
        queryKey: ['staging-invoices-customer', customerId],
        queryFn: () => stagingInvoicesService.getStagingInvoicesByCustomer(customerId),
        enabled: !!customerId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

// Hook to manage selected customer state
export function useSelectedStagingCustomer() {
    const [selectedCustomer, setSelectedCustomer] = useState<StagingCustomer | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const clearSelection = () => {
        setSelectedCustomer(null)
        setSearchQuery('')
    }

    return {
        selectedCustomer,
        setSelectedCustomer,
        searchQuery,
        setSearchQuery,
        clearSelection
    }
}
