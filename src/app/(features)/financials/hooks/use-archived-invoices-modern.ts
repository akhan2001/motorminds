import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ArchivedInvoiceService } from '../lib/archived-invoice-service'

interface UseArchivedInvoicesParams {
  shopId: string
  search?: string
  page?: number
  limit?: number
  enabled?: boolean
}

export function useArchivedInvoicesModern({
  shopId,
  search = '',
  page = 1,
  limit = 50,
  enabled = true
}: UseArchivedInvoicesParams) {
  return useQuery({
    queryKey: ['archived-invoices', { shopId, search, page, limit }],
    queryFn: () => ArchivedInvoiceService.getArchivedInvoices({
      shopId,
      page,
      limit,
      filters: { search }
    }),
    enabled: enabled && !!shopId,
    // Keep previous data while fetching new data (prevents loading states)
    placeholderData: keepPreviousData,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry failed requests
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useArchivedInvoiceCountModern({
  shopId,
  search = '',
  enabled = true
}: {
  shopId: string
  search?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['archived-invoices-count', { shopId, search }],
    queryFn: () => ArchivedInvoiceService.getArchivedInvoiceCount(shopId, { search }),
    enabled: enabled && !!shopId,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    // Don't refetch count as frequently
    refetchOnWindowFocus: false,
  })
}
