'use client'

import { useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import type { ExpenseItem } from '../types/expenses'
import {
    ExpenseListFormSchema,
    createDefaultExpenseListItem,
    type ExpenseListItemFormData,
    type ExpenseListFormData,
} from '../lib/validations/expense-schema'
import {
    useExpensesByWorkOrder,
    useExpensesByInvoice,
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
} from '../hooks/use-expenses'
import { ExpenseItemCard } from './ExpenseItemCard'

const TEMP_ID_PREFIX = 'temp-'

function expenseToFormItem(e: ExpenseItem): ExpenseListItemFormData {
    return {
        id: e.id,
        description: e.description,
        category: e.category,
        subtotal: Number(e.subtotal),
        tax_amount: e.tax_amount != null ? Number(e.tax_amount) : null,
        tax_rate: e.tax_rate ?? 0.13,
        tax_included: e.tax_included ?? true,
        total: Number(e.total),
        vendor: e.vendor ?? null,
        invoice_number: e.invoice_number ?? null,
        payment_method: (e.payment_method as ExpenseListItemFormData['payment_method']) ?? 'credit_card',
        parts_description: e.parts_description ?? null,
        expense_date: e.expense_date,
        warranty_period: e.warranty_period ?? null,
        notes: e.notes ?? null,
    }
}

export interface ExpenseItemsListProps {
    workOrderId?: string | null
    invoiceId?: string | null
    sourceType: 'work_order' | 'invoice' | 'general'
    isEditing?: boolean
    onItemSaved?: (item: ExpenseItem) => void
    onItemDeleted?: (id: string) => void
}

export interface ExpenseItemsListRef {
    /** Persist all expense items (create new, update existing, delete removed). Call from parent Save button. */
    persistAll: (options?: { workOrderId?: string | null; invoiceId?: string | null }) => Promise<boolean>
}

export const ExpenseItemsList = forwardRef<ExpenseItemsListRef, ExpenseItemsListProps>(function ExpenseItemsList({
    workOrderId,
    invoiceId,
    sourceType,
    isEditing = true,
    onItemSaved,
    onItemDeleted,
}, ref) {
    const { shopId } = useAuth()
    const deletedIdsRef = useRef<string[]>([])
    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter(
        (s: { status: string }) => s.status === 'active'
    )

    const byWorkOrder = !!workOrderId
    const byInvoice = !!invoiceId

    const { data: workOrderExpenses = [], refetch: refetchWO } =
        useExpensesByWorkOrder(workOrderId ?? null)
    const { data: invoiceExpenses = [], refetch: refetchInv } =
        useExpensesByInvoice(invoiceId ?? null)

    // When editing an invoice (invoiceId set), show invoice expenses; otherwise show work order expenses when workOrderId set
    const expenses: ExpenseItem[] = byInvoice
        ? invoiceExpenses
        : byWorkOrder
          ? workOrderExpenses
          : []

    const form = useForm<ExpenseListFormData>({
        resolver: zodResolver(ExpenseListFormSchema),
        defaultValues: { items: expenses.map(expenseToFormItem) },
        mode: 'all',
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    })

    const prevExpensesRef = useRef<string>('')
    useEffect(() => {
        const key = JSON.stringify(expenses.map((e) => e.id))
        if (key === prevExpensesRef.current) return
        prevExpensesRef.current = key
        form.reset({ items: expenses.map(expenseToFormItem) })
    }, [expenses, form])

    const createExpense = useCreateExpense()
    const updateExpense = useUpdateExpense()
    const deleteExpense = useDeleteExpense()

    const refetch = useCallback(() => {
        refetchWO()
        refetchInv()
    }, [refetchWO, refetchInv])

    const addItem = useCallback(() => {
        if (fields.length >= 20) {
            toast.error('Maximum 20 expense items allowed')
            return
        }
        append(
            createDefaultExpenseListItem(`${TEMP_ID_PREFIX}${uuidv4()}`)
        )
    }, [fields.length, append])

    const removeItem = useCallback(
        (index: number) => {
            const item = form.getValues(`items.${index}`)
            if (!item) return
            const id = item.id
            remove(index)
            if (!id.startsWith(TEMP_ID_PREFIX)) {
                deletedIdsRef.current = [...deletedIdsRef.current, id]
            }
        },
        [form, remove]
    )

    const buildPayload = useCallback(
        (item: ExpenseListItemFormData) => ({
            shop_id: shopId!,
            work_order_id: workOrderId ?? null,
            invoice_id: invoiceId ?? null,
            source_type: sourceType,
            description: item.description.trim(),
            category: item.category,
            subtotal: item.subtotal,
            tax_amount: item.tax_amount ?? 0,
            tax_rate: item.tax_rate ?? 0.13,
            tax_included: item.tax_included ?? true,
            total: item.total,
            vendor: item.vendor?.trim() || null,
            invoice_number: item.invoice_number?.trim() || null,
            payment_method: item.payment_method ?? null,
            parts_description: item.parts_description?.trim() || null,
            expense_date: item.expense_date,
            warranty_period: item.warranty_period?.trim() || null,
            notes: item.notes?.trim() || null,
            is_billable: false,
        }),
        [shopId, workOrderId, invoiceId, sourceType]
    )

    const persistAll = useCallback(async (options?: { workOrderId?: string | null; invoiceId?: string | null }): Promise<boolean> => {
        if (!shopId) return true
        const overrideWorkOrderId = options?.workOrderId !== undefined ? options.workOrderId : workOrderId
        const overrideInvoiceId = options?.invoiceId !== undefined ? options.invoiceId : invoiceId
        
        // Build payload with override IDs (use correct source_type when linking to invoice/work order)
        const effectiveSourceType = overrideInvoiceId
            ? 'invoice'
            : overrideWorkOrderId
              ? 'work_order'
              : sourceType
        const buildPayloadWithOverride = (item: ExpenseListItemFormData) => ({
            shop_id: shopId!,
            work_order_id: overrideWorkOrderId ?? null,
            invoice_id: overrideInvoiceId ?? null,
            source_type: effectiveSourceType,
            description: item.description.trim(),
            category: item.category,
            subtotal: item.subtotal,
            tax_amount: item.tax_amount ?? 0,
            tax_rate: item.tax_rate ?? 0.13,
            tax_included: item.tax_included ?? true,
            total: item.total,
            vendor: item.vendor?.trim() || null,
            invoice_number: item.invoice_number?.trim() || null,
            payment_method: item.payment_method ?? null,
            parts_description: item.parts_description?.trim() || null,
            expense_date: item.expense_date,
            warranty_period: item.warranty_period?.trim() || null,
            notes: item.notes?.trim() || null,
            is_billable: false,
        })
        
        const items = form.getValues('items') ?? []
        const toCreate: ExpenseListItemFormData[] = []
        const toUpdate: { id: string; data: ReturnType<typeof buildPayloadWithOverride> }[] = []
        for (const item of items) {
            if (!item.description?.trim() || (item.total ?? 0) <= 0) continue
            if (item.id.startsWith(TEMP_ID_PREFIX)) {
                toCreate.push(item)
            } else {
                toUpdate.push({ id: item.id, data: buildPayloadWithOverride(item) })
            }
        }
        const toDelete = [...deletedIdsRef.current]
        try {
            for (const item of toCreate) {
                await createExpense.mutateAsync(buildPayloadWithOverride(item))
                onItemSaved?.({} as ExpenseItem)
            }
            for (const { id, data } of toUpdate) {
                await updateExpense.mutateAsync({ id, data })
                onItemSaved?.({} as ExpenseItem)
            }
            for (const id of toDelete) {
                await deleteExpense.mutateAsync(id)
                onItemDeleted?.(id)
            }
            deletedIdsRef.current = []
            await refetch()
            return true
        } catch (err) {
            // Rethrow so parent can show error (e.g. "Failed to create expense")
            throw err
        }
    }, [
        shopId,
        form,
        workOrderId,
        invoiceId,
        sourceType,
        buildPayload,
        createExpense,
        updateExpense,
        deleteExpense,
        refetch,
        onItemSaved,
        onItemDeleted,
    ])

    useImperativeHandle(ref, () => ({ persistAll }), [persistAll])

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-foreground">
                    Expense Items
                </h3>
                <span className="text-sm text-muted-foreground">
                    Expenses are excluded from totals (tracking only)
                </span>
            </div>

            {fields.length === 0 ? (
                isEditing ? (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        className="group w-full py-8 border border-dashed border-border rounded-lg bg-transparent hover:bg-transparent hover:border-solid hover:border-orange-500/50 text-muted-foreground transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                        Add Expense
                    </Button>
                ) : (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                        No expense items added yet.
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <ExpenseItemCard
                            key={field.id}
                            index={index}
                            form={form}
                            isEditing={isEditing}
                            shopId={shopId || ''}
                            activeSuppliers={activeSuppliers}
                            onRemove={() => removeItem(index)}
                            isDeleting={false}
                        />
                    ))}
                </div>
            )}

            {isEditing && fields.length > 0 && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </Button>
                </div>
            )}
        </div>
    )
})
