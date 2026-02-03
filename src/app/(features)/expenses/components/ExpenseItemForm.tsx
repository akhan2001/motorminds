"use client"

import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import SupplierDropdownSelector from '@/app/(features)/suppliers/components/supplier-dropdown-selector'
import type { ExpenseItem } from '../types/expenses'
import {
    ExpenseFormSchema,
    type ExpenseFormValues,
    EXPENSE_CATEGORIES,
    EXPENSE_PAYMENT_METHODS,
    HST_RATE,
    calculateTaxFromSubtotal,
    calculateSubtotalFromTotal,
} from '../lib/validations/expense-schema'
import { useCreateExpense, useUpdateExpense } from '../hooks/use-expenses'

export interface ExpenseItemFormProps {
    /** Existing expense to edit, or undefined for create */
    expense?: ExpenseItem | null
    workOrderId?: string | null
    invoiceId?: string | null
    sourceType?: ExpenseItem['source_type']
    onSaved?: (expense: ExpenseItem) => void
    onCancel?: () => void
}

import { getTorontoDateString } from '@/lib/utils/date'

// Use Toronto timezone for expense dates to ensure consistency with financial reports
const today = () => getTorontoDateString()

function getDefaultValues(
    shopId: string,
    expense: ExpenseItem | null | undefined,
    workOrderId: string | null | undefined,
    invoiceId: string | null | undefined,
    sourceType: ExpenseItem['source_type']
): ExpenseFormValues {
    if (expense) {
        return {
            shop_id: expense.shop_id,
            work_order_id: expense.work_order_id ?? undefined,
            invoice_id: expense.invoice_id ?? undefined,
            source_type: expense.source_type,
            description: expense.description,
            category: expense.category,
            subtotal: Number(expense.subtotal),
            tax_amount: expense.tax_amount != null ? Number(expense.tax_amount) : 0,
            tax_rate: expense.tax_rate ?? 0.13,
            tax_included: expense.tax_included ?? true,
            total: Number(expense.total),
            vendor: expense.vendor ?? undefined,
            invoice_number: expense.invoice_number ?? undefined,
            payment_method: (expense.payment_method as ExpenseFormValues['payment_method']) ?? 'credit_card',
            parts_description: expense.parts_description ?? undefined,
            expense_date: expense.expense_date,
            warranty_period: expense.warranty_period ?? undefined,
            notes: expense.notes ?? undefined,
            receipt_url: expense.receipt_url ?? undefined,
            is_billable: expense.is_billable ?? false,
        }
    }
    return {
        shop_id: shopId,
        work_order_id: workOrderId ?? undefined,
        invoice_id: invoiceId ?? undefined,
        source_type: sourceType,
        description: '',
        category: EXPENSE_CATEGORIES[0],
        subtotal: 0,
        tax_amount: 0,
        tax_rate: 0.13,
        tax_included: true,
        total: 0,
        vendor: undefined,
        invoice_number: undefined,
        payment_method: 'credit_card',
        parts_description: undefined,
        expense_date: today(),
        warranty_period: undefined,
        notes: undefined,
        receipt_url: undefined,
        is_billable: false,
    }
}

export function ExpenseItemForm({
    expense,
    workOrderId,
    invoiceId,
    sourceType = 'general',
    onSaved,
    onCancel,
}: ExpenseItemFormProps) {
    const { shopId } = useAuth()
    const createExpense = useCreateExpense()
    const updateExpense = useUpdateExpense()

    const isEdit = !!expense?.id

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(ExpenseFormSchema),
        defaultValues: getDefaultValues(
            shopId || '',
            expense,
            workOrderId,
            invoiceId,
            sourceType
        ),
        mode: 'all',
    })

    // Reset form when expense or shopId changes
    useEffect(() => {
        if (!shopId) return
        form.reset(
            getDefaultValues(shopId, expense, workOrderId, invoiceId, sourceType)
        )
    }, [expense?.id, shopId, workOrderId, invoiceId, sourceType])

    // Local state for Amount & Tax (subtotal/total/tax sync)
    const [subtotalStr, setSubtotalStr] = useState(
        () => (expense ? Number(expense.subtotal).toFixed(2) : '')
    )
    const [taxAmountStr, setTaxAmountStr] = useState(
        () =>
            (expense?.tax_amount != null
                ? Number(expense.tax_amount).toFixed(2)
                : '0.00')
    )
    const [totalStr, setTotalStr] = useState(
        () => (expense ? Number(expense.total).toFixed(2) : '')
    )
    const [includeTax, setIncludeTax] = useState(
        expense?.tax_included ?? true
    )
    const lastEditedRef = useRef<'subtotal' | 'total'>('subtotal')
    const isInternalRef = useRef(false)

    const watchedSubtotal = form.watch('subtotal')
    const watchedTotal = form.watch('total')
    const watchedTaxIncluded = form.watch('tax_included')

    // Sync form -> local when form values change from outside
    useEffect(() => {
        if (isInternalRef.current) {
            isInternalRef.current = false
            return
        }
        setSubtotalStr(
            typeof watchedSubtotal === 'number' && watchedSubtotal >= 0
                ? watchedSubtotal.toFixed(2)
                : ''
        )
        setTotalStr(
            typeof watchedTotal === 'number' && watchedTotal > 0
                ? watchedTotal.toFixed(2)
                : ''
        )
        const taxVal = form.getValues('tax_amount')
        setTaxAmountStr(
            taxVal != null && Number(taxVal) >= 0 ? Number(taxVal).toFixed(2) : '0.00'
        )
        setIncludeTax(watchedTaxIncluded ?? true)
    }, [watchedSubtotal, watchedTotal, watchedTaxIncluded])

    const handleSubtotalChange = (value: string) => {
        lastEditedRef.current = 'subtotal'
        setSubtotalStr(value)
        const sub = parseFloat(value) || 0
        const { taxAmount, total } = calculateTaxFromSubtotal(
            sub,
            includeTax,
            form.getValues('tax_rate') ?? HST_RATE
        )
        isInternalRef.current = true
        form.setValue('subtotal', sub, { shouldValidate: false })
        form.setValue('tax_amount', taxAmount, { shouldValidate: false })
        form.setValue('total', total, { shouldValidate: false })
        setTaxAmountStr(taxAmount.toFixed(2))
        setTotalStr(total.toFixed(2))
    }

    const handleTotalChange = (value: string) => {
        lastEditedRef.current = 'total'
        setTotalStr(value)
        const total = parseFloat(value) || 0
        const { subtotal, taxAmount } = calculateSubtotalFromTotal(
            total,
            includeTax,
            form.getValues('tax_rate') ?? HST_RATE
        )
        isInternalRef.current = true
        form.setValue('subtotal', subtotal, { shouldValidate: false })
        form.setValue('tax_amount', taxAmount, { shouldValidate: false })
        form.setValue('total', total, { shouldValidate: false })
        setSubtotalStr(subtotal.toFixed(2))
        setTaxAmountStr(taxAmount.toFixed(2))
    }

    const handleTaxToggle = (checked: boolean) => {
        setIncludeTax(checked)
        form.setValue('tax_included', checked, { shouldValidate: false })
        const sub = parseFloat(subtotalStr) || 0
        if (sub > 0) {
            const { taxAmount, total } = calculateTaxFromSubtotal(
                sub,
                checked,
                form.getValues('tax_rate') ?? HST_RATE
            )
            isInternalRef.current = true
            form.setValue('tax_amount', taxAmount, { shouldValidate: false })
            form.setValue('total', total, { shouldValidate: false })
            setTaxAmountStr(taxAmount.toFixed(2))
            setTotalStr(total.toFixed(2))
        }
    }

    const onSubmit = async (values: ExpenseFormValues) => {
        if (!shopId) return
        const payload = {
            shop_id: shopId,
            work_order_id: values.work_order_id ?? workOrderId ?? null,
            invoice_id: values.invoice_id ?? invoiceId ?? null,
            source_type: values.source_type,
            description: values.description.trim(),
            category: values.category,
            subtotal: values.subtotal,
            tax_amount: values.tax_amount ?? 0,
            tax_rate: values.tax_rate ?? 0.13,
            tax_included: values.tax_included ?? true,
            total: values.total,
            vendor: values.vendor?.trim() || null,
            invoice_number: values.invoice_number?.trim() || null,
            payment_method: values.payment_method || null,
            parts_description: values.parts_description?.trim() || null,
            expense_date: values.expense_date,
            warranty_period: values.warranty_period?.trim() || null,
            notes: values.notes?.trim() || null,
            receipt_url:
                values.receipt_url?.trim() &&
                /^https?:\/\//.test(values.receipt_url.trim())
                    ? values.receipt_url.trim()
                    : null,
            is_billable: values.is_billable ?? false,
        }

        try {
            if (isEdit && expense?.id) {
                const updated = await updateExpense.mutateAsync({
                    id: expense.id,
                    data: payload,
                })
                onSaved?.(updated)
            } else {
                const created = await createExpense.mutateAsync(payload)
                onSaved?.(created)
            }
        } catch {
            // Toast handled in hooks
        }
    }

    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter((s: { status: string }) => s.status === 'active')

    const isSubmitting =
        createExpense.isPending || updateExpense.isPending

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 rounded-lg border border-border bg-card p-4 dark:bg-[#131313]"
        >
            <div className="space-y-4">
                {/* Vendor */}
                <div className="space-y-2">
                    <Label>Vendor / Supplier</Label>
                    <Controller
                        control={form.control}
                        name="vendor"
                        render={({ field }) => (
                            <SupplierDropdownSelector
                                value={
                                    activeSuppliers.find(
                                        (s: { name: string }) => s.name === field.value
                                    )
                                        ? activeSuppliers.find(
                                              (s: { name: string }) =>
                                                  s.name === field.value
                                          )?.id
                                        : field.value
                                        ? 'custom'
                                        : ''
                                }
                                onValueChange={(id: string) => {
                                    const s = activeSuppliers.find(
                                        (x: { id: string }) => x.id === id
                                    )
                                    field.onChange(
                                        id === 'custom' ? '' : s?.name ?? ''
                                    )
                                }}
                                placeholder="Select a supplier..."
                                showCustomOption
                                customOptionValue="custom"
                                customOptionLabel="Enter Custom Vendor"
                                className="bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                    {form.watch('vendor') &&
                        !activeSuppliers.find(
                            (s: { name: string }) => s.name === form.watch('vendor')
                        ) && (
                            <Input
                                value={form.watch('vendor') ?? ''}
                                onChange={(e) =>
                                    form.setValue('vendor', e.target.value)
                                }
                                placeholder="Custom vendor name"
                                className="bg-white dark:bg-background border-border"
                            />
                        )}
                </div>

                {/* Invoice # (vendor) */}
                <div className="space-y-2">
                    <Label>Vendor Invoice #</Label>
                    <Controller
                        control={form.control}
                        name="invoice_number"
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder="Vendor invoice number"
                                className="bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label>
                        Expense Name <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        control={form.control}
                        name="description"
                        render={({ field, fieldState }) => (
                            <>
                                <Input
                                    {...field}
                                    placeholder="e.g., Oil Filters - Bulk Order"
                                    className="bg-white dark:bg-background border-border"
                                />
                                {fieldState.error && (
                                    <p className="text-sm text-red-500">
                                        {fieldState.error.message}
                                    </p>
                                )}
                            </>
                        )}
                    />
                </div>

                {/* Amount & Tax */}
                <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Amount & Tax</span>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">
                                Include HST (13%)
                            </Label>
                            <Switch
                                checked={includeTax}
                                onCheckedChange={handleTaxToggle}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">
                                Subtotal
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={subtotalStr}
                                onChange={(e) =>
                                    handleSubtotalChange(e.target.value)
                                }
                                className="bg-white dark:bg-background border-border"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">
                                HST (13%)
                            </Label>
                            <Input
                                type="number"
                                readOnly
                                value={taxAmountStr}
                                className="bg-muted/50 cursor-not-allowed border-border"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs">
                                Total <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={totalStr}
                                onChange={(e) =>
                                    handleTotalChange(e.target.value)
                                }
                                className="bg-white dark:bg-background border-border font-semibold"
                            />
                            {form.formState.errors.total && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.total.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>
                            Category <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={form.control}
                            name="category"
                            render={({ field, fieldState }) => (
                                <>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-background border-border">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXPENSE_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.error && (
                                        <p className="text-sm text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={form.control}
                            name="expense_date"
                            render={({ field, fieldState }) => (
                                <>
                                    <Input
                                        type="date"
                                        {...field}
                                        className="bg-white dark:bg-background border-border"
                                    />
                                    {fieldState.error && (
                                        <p className="text-sm text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </>
                            )}
                        />
                    </div>
                </div>

                {/* Warranty */}
                <div className="space-y-2">
                    <Label>Warranty</Label>
                    <Controller
                        control={form.control}
                        name="warranty_period"
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder="e.g., 1 year, 90 days"
                                className="bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Controller
                        control={form.control}
                        name="payment_method"
                        render={({ field }) => (
                            <Select
                                value={field.value ?? 'credit_card'}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="bg-white dark:bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_PAYMENT_METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Parts description */}
                <div className="space-y-2">
                    <Label>Parts / Item Description</Label>
                    <Controller
                        control={form.control}
                        name="parts_description"
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder="Details about parts or items"
                                className="min-h-[60px] bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label>Notes</Label>
                    <Controller
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                value={field.value ?? ''}
                                placeholder="Additional details..."
                                className="min-h-[60px] bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                </div>

                {/* Receipt URL */}
                <div className="space-y-2">
                    <Label>Receipt URL</Label>
                    <Controller
                        control={form.control}
                        name="receipt_url"
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                placeholder="https://..."
                                type="url"
                                className="bg-white dark:bg-background border-border"
                            />
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEdit ? 'Update expense' : 'Create expense'}
                </Button>
            </div>
        </form>
    )
}
