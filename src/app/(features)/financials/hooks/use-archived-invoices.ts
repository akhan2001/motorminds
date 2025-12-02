import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ArchivedInvoiceService, type ArchivedInvoiceListParams } from '../lib/archived-invoice-service'

export function useArchivedInvoices(params: ArchivedInvoiceListParams) {
    return useQuery({
        queryKey: ['archived-invoices', params],
        queryFn: () => ArchivedInvoiceService.getArchivedInvoices(params),
        enabled: !!params.shopId,
        staleTime: 30000, // 30 seconds
        placeholderData: keepPreviousData, // Keep previous data while fetching new data (prevents re-renders)
    })
}

export function useArchivedInvoice(invoiceId: string) {
    return useQuery({
        queryKey: ['archived-invoice', invoiceId],
        queryFn: () => ArchivedInvoiceService.getArchivedInvoice(invoiceId),
        enabled: !!invoiceId,
        staleTime: 60000, // 1 minute
    })
}

export function useArchivedInvoiceCount(shopId: string, filters?: any) {
    return useQuery({
        queryKey: ['archived-invoice-count', shopId, filters],
        queryFn: () => ArchivedInvoiceService.getArchivedInvoiceCount(shopId, filters),
        enabled: !!shopId,
        staleTime: 30000,
        placeholderData: keepPreviousData, // Keep previous data while fetching new data (prevents re-renders)
    })
}

