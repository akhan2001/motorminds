import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import invoiceItemsService from '../lib/invoice-items-service'
import type {
  InvoiceItemCreateData,
  InvoiceItemUpdateData,
  WorkOrderItemImport,
} from '../types/invoice-items'

// Query keys
export const invoiceItemKeys = {
  all: ['invoice-items'] as const,
  lists: () => [...invoiceItemKeys.all, 'list'] as const,
  list: (invoiceId: string) => [...invoiceItemKeys.lists(), invoiceId] as const,
  details: () => [...invoiceItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceItemKeys.details(), id] as const,
  summary: (invoiceId: string) => [...invoiceItemKeys.all, 'summary', invoiceId] as const,
}

/**
 * Fetch all items for an invoice
 */
export function useInvoiceItems(invoiceId: string) {
  return useQuery({
    queryKey: invoiceItemKeys.list(invoiceId),
    queryFn: () => invoiceItemsService.getInvoiceItems(invoiceId),
    enabled: !!invoiceId,
  })
}

/**
 * Fetch a single invoice item
 */
export function useInvoiceItem(itemId: string) {
  return useQuery({
    queryKey: invoiceItemKeys.detail(itemId),
    queryFn: () => invoiceItemsService.getInvoiceItem(itemId),
    enabled: !!itemId,
  })
}

/**
 * Fetch invoice summary
 */
export function useInvoiceSummary(invoiceId: string) {
  return useQuery({
    queryKey: invoiceItemKeys.summary(invoiceId),
    queryFn: () => invoiceItemsService.calculateInvoiceSummary(invoiceId),
    enabled: !!invoiceId,
  })
}

/**
 * Create a new invoice item
 */
export function useCreateInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InvoiceItemCreateData) =>
      invoiceItemsService.createInvoiceItem(data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(newItem.invoice_id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(newItem.invoice_id) })
      toast.success('Item added successfully')
    },
    onError: (error: any) => {
      console.error('Failed to create invoice item:', error)
      toast.error(error.message || 'Failed to add item')
    },
  })
}

/**
 * Update an invoice item
 */
export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: InvoiceItemUpdateData }) =>
      invoiceItemsService.updateInvoiceItem(itemId, updates),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(updatedItem.invoice_id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.detail(updatedItem.id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(updatedItem.invoice_id) })
      toast.success('Item updated successfully')
    },
    onError: (error: any) => {
      console.error('Failed to update invoice item:', error)
      toast.error(error.message || 'Failed to update item')
    },
  })
}

/**
 * Delete an invoice item (soft delete)
 */
export function useDeleteInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, invoiceId }: { itemId: string; invoiceId: string }) =>
      invoiceItemsService.deleteInvoiceItem(itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(variables.invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(variables.invoiceId) })
      toast.success('Item removed successfully')
    },
    onError: (error: any) => {
      console.error('Failed to delete invoice item:', error)
      toast.error(error.message || 'Failed to remove item')
    },
  })
}

/**
 * Import work order items
 */
export function useImportWorkOrderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      invoiceId,
      shopId,
      workOrderItems,
    }: {
      invoiceId: string
      shopId: string
      workOrderItems: WorkOrderItemImport[]
    }) => invoiceItemsService.importWorkOrderItems(invoiceId, shopId, workOrderItems),
    onSuccess: (items, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(variables.invoiceId) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(variables.invoiceId) })
      toast.success(`${items.length} items imported from work order`)
    },
    onError: (error: any) => {
      console.error('Failed to import work order items:', error)
      toast.error(error.message || 'Failed to import work order items')
    },
  })
}

/**
 * Duplicate an invoice item
 */
export function useDuplicateInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => invoiceItemsService.duplicateInvoiceItem(itemId),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(newItem.invoice_id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(newItem.invoice_id) })
      toast.success('Item duplicated successfully')
    },
    onError: (error: any) => {
      console.error('Failed to duplicate invoice item:', error)
      toast.error(error.message || 'Failed to duplicate item')
    },
  })
}

/**
 * Restore item to original work order values
 */
export function useRestoreInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => invoiceItemsService.restoreToOriginal(itemId),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(updatedItem.invoice_id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.detail(updatedItem.id) })
      queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(updatedItem.invoice_id) })
      toast.success('Item restored to original values')
    },
    onError: (error: any) => {
      console.error('Failed to restore invoice item:', error)
      toast.error(error.message || 'Failed to restore item')
    },
  })
}

/**
 * Bulk update invoice items
 */
export function useBulkUpdateInvoiceItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (items: Array<{ id: string; updates: InvoiceItemUpdateData }>) =>
      invoiceItemsService.bulkUpdateItems(items),
    onSuccess: (updatedItems) => {
      if (updatedItems.length > 0) {
        const invoiceId = updatedItems[0].invoice_id
        queryClient.invalidateQueries({ queryKey: invoiceItemKeys.list(invoiceId) })
        queryClient.invalidateQueries({ queryKey: invoiceItemKeys.summary(invoiceId) })
      }
      toast.success(`${updatedItems.length} items updated successfully`)
    },
    onError: (error: any) => {
      console.error('Failed to bulk update invoice items:', error)
      toast.error(error.message || 'Failed to update items')
    },
  })
}

