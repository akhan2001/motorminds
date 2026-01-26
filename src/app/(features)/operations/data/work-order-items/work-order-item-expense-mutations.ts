import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { workOrderItemKeys } from './keys'
import { WorkOrderItemsService } from '../../lib/work-order-items-service'
import type { WorkOrderItemCreateData, WorkOrderItemUpdateData } from '../../lib/validations/work-order-items'
import type { WorkOrderExpenseItemFormData } from '../../lib/validations/work-order-expense-items'

/**
 * Variables for creating an expense item
 */
export type WorkOrderExpenseItemCreateVariables = {
    workOrderId: string
    item: WorkOrderExpenseItemFormData
}

/**
 * Variables for deleting an expense item
 */
export type WorkOrderExpenseItemDeleteVariables = {
    workOrderId: string
    itemId: string
}

/**
 * Variables for updating an expense item
 */
export type WorkOrderExpenseItemUpdateVariables = {
    workOrderId: string
    itemId: string
    item: Partial<WorkOrderExpenseItemFormData>
}

/**
 * Convert form data to service format
 */
function convertFormDataToServiceFormat(
    workOrderId: string,
    item: WorkOrderExpenseItemFormData
): WorkOrderItemCreateData {
    return {
        work_order_id: workOrderId,
        item_type: 'expense' as const,
        description: item.description,
        part_number: item.expense_invoice_number || item.part_number || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost ?? undefined,
        supplier: item.expense_vendor || item.supplier || undefined,
        category: item.category || undefined,
        warranty_period: item.warranty_period || undefined,
        notes: item.notes || undefined,
        is_billable: false,
        expense_subtotal: item.expense_subtotal ?? undefined,
        expense_tax_amount: item.expense_tax_amount ?? undefined,
        expense_tax_included: item.expense_tax_included ?? true,
        expense_payment_method: item.expense_payment_method || undefined,
        expense_vendor: item.expense_vendor || undefined,
        expense_invoice_number: item.expense_invoice_number || undefined,
        expense_parts_description: item.expense_parts_description || undefined,
        expense_cost_date: item.expense_cost_date || undefined,
    }
}

/**
 * Create expense item API call
 */
async function createExpenseItem({ workOrderId, item }: WorkOrderExpenseItemCreateVariables) {
    const serviceData = convertFormDataToServiceFormat(workOrderId, item)
    return await WorkOrderItemsService.createWorkOrderItem(serviceData)
}

/**
 * Delete expense item API call
 */
async function deleteExpenseItem({ itemId }: WorkOrderExpenseItemDeleteVariables) {
    return await WorkOrderItemsService.deleteWorkOrderItem(itemId)
}

/**
 * Update expense item API call
 */
async function updateExpenseItem({ itemId, item }: WorkOrderExpenseItemUpdateVariables) {
    return await WorkOrderItemsService.updateWorkOrderItem(itemId, {
        description: item.description,
        part_number: item.expense_invoice_number || item.part_number || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost ?? undefined,
        supplier: item.expense_vendor || item.supplier || undefined,
        category: item.category || undefined,
        warranty_period: item.warranty_period || undefined,
        notes: item.notes || undefined,
        is_billable: false,
        expense_subtotal: item.expense_subtotal ?? undefined,
        expense_tax_amount: item.expense_tax_amount ?? undefined,
        expense_tax_included: item.expense_tax_included ?? true,
        expense_payment_method: item.expense_payment_method || undefined,
        expense_vendor: item.expense_vendor || undefined,
        expense_invoice_number: item.expense_invoice_number || undefined,
        expense_parts_description: item.expense_parts_description !== undefined 
            ? (item.expense_parts_description?.trim() || null)
            : undefined,
        expense_cost_date: item.expense_cost_date || undefined,
    })
}

/**
 * Hook for creating expense items with automatic cache invalidation
 */
export function useWorkOrderExpenseItemCreateMutation(options?: {
    onSuccess?: (data: any, variables: WorkOrderExpenseItemCreateVariables) => void
    onError?: (error: Error, variables: WorkOrderExpenseItemCreateVariables) => void
}) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createExpenseItem,
        onSuccess: async (data, variables) => {
            // Invalidate related queries
            await Promise.all([
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.list(variables.workOrderId) 
                }),
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.workOrder(variables.workOrderId) 
                }),
            ])
            options?.onSuccess?.(data, variables)
        },
        onError: (error: Error, variables) => {
            if (options?.onError) {
                options.onError(error, variables)
            } else {
                toast.error(`Failed to create expense item: ${error.message}`)
            }
        },
    })
}

/**
 * Hook for deleting expense items with automatic cache invalidation
 */
export function useWorkOrderExpenseItemDeleteMutation(options?: {
    onSuccess?: (data: any, variables: WorkOrderExpenseItemDeleteVariables) => void
    onError?: (error: Error, variables: WorkOrderExpenseItemDeleteVariables) => void
}) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteExpenseItem,
        onSuccess: async (data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.list(variables.workOrderId) 
                }),
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.workOrder(variables.workOrderId) 
                }),
            ])
            options?.onSuccess?.(data, variables)
        },
        onError: (error: Error, variables) => {
            if (options?.onError) {
                options.onError(error, variables)
            } else {
                toast.error(`Failed to delete expense item: ${error.message}`)
            }
        },
    })
}

/**
 * Hook for updating expense items with automatic cache invalidation
 */
export function useWorkOrderExpenseItemUpdateMutation(options?: {
    onSuccess?: (data: any, variables: WorkOrderExpenseItemUpdateVariables) => void
    onError?: (error: Error, variables: WorkOrderExpenseItemUpdateVariables) => void
}) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateExpenseItem,
        onSuccess: async (data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.list(variables.workOrderId) 
                }),
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemKeys.workOrder(variables.workOrderId) 
                }),
            ])
            options?.onSuccess?.(data, variables)
        },
        onError: (error: Error, variables) => {
            if (options?.onError) {
                options.onError(error, variables)
            } else {
                toast.error(`Failed to update expense item: ${error.message}`)
            }
        },
    })
}
