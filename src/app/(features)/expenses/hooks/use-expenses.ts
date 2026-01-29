'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExpensesService } from '../lib/expenses-service'
import type {
    ExpenseItem,
    ExpenseFilters,
    CreateExpenseRequest,
    UpdateExpenseRequest,
} from '../types/expenses'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'

export const expenseKeys = {
    all: (shopId: string) => ['expenses', shopId] as const,
    lists: (shopId: string) => [...expenseKeys.all(shopId), 'list'] as const,
    list: (shopId: string, filters?: ExpenseFilters) =>
        [...expenseKeys.lists(shopId), filters ?? {}] as const,
    detail: (shopId: string, id: string) =>
        [...expenseKeys.all(shopId), 'detail', id] as const,
    byWorkOrder: (shopId: string, workOrderId: string) =>
        [...expenseKeys.all(shopId), 'work-order', workOrderId] as const,
    byInvoice: (shopId: string, invoiceId: string) =>
        [...expenseKeys.all(shopId), 'invoice', invoiceId] as const,
    summary: (shopId: string, dateFrom?: string, dateTo?: string) =>
        [...expenseKeys.all(shopId), 'summary', dateFrom, dateTo] as const,
}

export function useExpenses(
    filters: ExpenseFilters = {},
    page = 1,
    limit = 50
) {
    const { shopId } = useAuth()

    return useQuery({
        queryKey: expenseKeys.list(shopId || '', filters),
        queryFn: () =>
            ExpensesService.getExpenses(shopId!, filters, page, limit),
        enabled: !!shopId,
        staleTime: 30 * 1000,
    })
}

export function useExpense(id: string | null) {
    const { shopId } = useAuth()

    return useQuery({
        queryKey: expenseKeys.detail(shopId || '', id ?? ''),
        queryFn: () => ExpensesService.getExpense(id!, shopId!),
        enabled: !!shopId && !!id,
    })
}

export function useExpensesByWorkOrder(workOrderId: string | null) {
    const { shopId } = useAuth()

    return useQuery({
        queryKey: expenseKeys.byWorkOrder(shopId || '', workOrderId ?? ''),
        queryFn: () =>
            ExpensesService.getExpensesByWorkOrder(workOrderId, shopId!),
        enabled: !!shopId && !!workOrderId,
    })
}

export function useExpensesByInvoice(invoiceId: string | null) {
    const { shopId } = useAuth()

    return useQuery({
        queryKey: expenseKeys.byInvoice(shopId || '', invoiceId ?? ''),
        queryFn: () =>
            ExpensesService.getExpensesByInvoice(invoiceId, shopId!),
        enabled: !!shopId && !!invoiceId,
    })
}

export function useExpenseSummary(dateFrom?: string, dateTo?: string) {
    const { shopId } = useAuth()

    return useQuery({
        queryKey: expenseKeys.summary(shopId || '', dateFrom, dateTo),
        queryFn: () =>
            ExpensesService.getExpenseSummary(shopId!, dateFrom, dateTo),
        enabled: !!shopId,
    })
}

export function useCreateExpense() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (data: CreateExpenseRequest) =>
            ExpensesService.createExpense(shopId!, data),
        onSuccess: (data: ExpenseItem) => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId!) })
            if (data.work_order_id) {
                queryClient.invalidateQueries({
                    queryKey: expenseKeys.byWorkOrder(shopId!, data.work_order_id),
                })
            }
            if (data.invoice_id) {
                queryClient.invalidateQueries({
                    queryKey: expenseKeys.byInvoice(shopId!, data.invoice_id),
                })
            }
            toast.success('Expense created')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to create expense')
        },
    })
}

export function useUpdateExpense() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: UpdateExpenseRequest
        }) => ExpensesService.updateExpense(id, shopId!, data),
        onSuccess: (data: ExpenseItem) => {
            queryClient.invalidateQueries({
                queryKey: expenseKeys.detail(shopId!, data.id),
            })
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId!) })
            if (data.work_order_id) {
                queryClient.invalidateQueries({
                    queryKey: expenseKeys.byWorkOrder(shopId!, data.work_order_id),
                })
            }
            if (data.invoice_id) {
                queryClient.invalidateQueries({
                    queryKey: expenseKeys.byInvoice(shopId!, data.invoice_id),
                })
            }
            toast.success('Expense updated')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to update expense')
        },
    })
}

export function useLinkExpenseToInvoice() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: ({
            expenseId,
            invoiceId,
        }: {
            expenseId: string
            invoiceId: string
        }) =>
            ExpensesService.linkExpenseToInvoice(
                expenseId,
                shopId!,
                invoiceId
            ),
        onSuccess: (data: ExpenseItem) => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId!) })
            if (data.invoice_id) {
                queryClient.invalidateQueries({
                    queryKey: expenseKeys.byInvoice(shopId!, data.invoice_id),
                })
            }
            toast.success('Expense linked to invoice')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to link expense')
        },
    })
}

export function useArchiveExpense() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (id: string) =>
            ExpensesService.archiveExpense(id, shopId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId!) })
            toast.success('Expense archived')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to archive expense')
        },
    })
}

export function useDeleteExpense() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (id: string) =>
            ExpensesService.deleteExpense(id, shopId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: expenseKeys.all(shopId!) })
            toast.success('Expense deleted')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to delete expense')
        },
    })
}
