'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    type ExpenseListItemFormData,
    type ExpenseListFormData,
    HST_RATE,
    calculateTaxFromSubtotal,
    calculateSubtotalFromTotal,
} from '../lib/validations/expense-schema'
import {
    VendorSection,
    DescriptionSection,
    AmountTaxSection,
    CategoryDateSection,
    WarrantySection,
    PaymentMethodSection,
    NotesSection,
} from './ExpenseFormSections'

interface ExpenseItemCardProps {
    index: number
    form: ReturnType<typeof useForm<ExpenseListFormData>>
    isEditing: boolean
    shopId: string
    activeSuppliers: { id: string; name: string }[]
    onRemove: () => void
    isDeleting: boolean
}

export function ExpenseItemCard({
    index,
    form,
    isEditing,
    shopId,
    activeSuppliers,
    onRemove,
    isDeleting,
}: ExpenseItemCardProps) {
    const item = useWatch({ control: form.control, name: `items.${index}` }) as
        | ExpenseListItemFormData
        | undefined

    const isInternalUpdateRef = useRef(false)
    const isTaxToggleRef = useRef(false)
    const isCalculatingRef = useRef(false)
    const isHandlingTotalChangeRef = useRef(false)

    const [subtotal, setSubtotal] = useState(
        () => item?.subtotal?.toFixed(2) ?? ''
    )
    const [taxAmount, setTaxAmount] = useState(
        () => item?.tax_amount?.toFixed(2) ?? '0.00'
    )
    const [totalAmount, setTotalAmount] = useState(
        () => item?.total?.toFixed(2) ?? ''
    )
    const [includeTax, setIncludeTax] = useState(
        item?.tax_included ?? true
    )
    const [lastEditedField, setLastEditedField] = useState<'subtotal' | 'total'>(
        'subtotal'
    )

    useEffect(() => {
        if (isCalculatingRef.current || isHandlingTotalChangeRef.current) {
            isHandlingTotalChangeRef.current = false
            isCalculatingRef.current = false
            return
        }
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false
            return
        }
        if (!item) return
        setSubtotal(item.subtotal?.toFixed(2) ?? '')
        setTaxAmount(item.tax_amount?.toFixed(2) ?? '0.00')
        setTotalAmount(item.total?.toFixed(2) ?? '')
        setIncludeTax(item.tax_included ?? true)
    }, [item?.subtotal, item?.tax_amount, item?.total, item?.tax_included])

    useEffect(() => {
        if (isCalculatingRef.current || isTaxToggleRef.current) return
        if (lastEditedField !== 'subtotal') return
        if (subtotal === '') return
        const sub = parseFloat(subtotal) || 0
        isCalculatingRef.current = true
        try {
            const { taxAmount: tax, total } = calculateTaxFromSubtotal(
                sub,
                includeTax,
                item?.tax_rate ?? HST_RATE
            )
            isInternalUpdateRef.current = true
            setTaxAmount(tax.toFixed(2))
            setTotalAmount(total.toFixed(2))
            form.setValue(`items.${index}.subtotal`, sub, { shouldValidate: false })
            form.setValue(`items.${index}.tax_amount`, tax, { shouldValidate: false })
            form.setValue(`items.${index}.total`, total, { shouldValidate: false })
        } finally {
            isCalculatingRef.current = false
        }
    }, [subtotal, includeTax, lastEditedField, form, index, item?.tax_rate])

    const handleSubtotalChange = (value: string) => {
        setLastEditedField('subtotal')
        setSubtotal(value)
    }

    const handleTotalChange = (value: string) => {
        isHandlingTotalChangeRef.current = true
        isCalculatingRef.current = true
        isInternalUpdateRef.current = true
        setLastEditedField('total')
        setTotalAmount(value)
        const total = parseFloat(value) || 0
        const { subtotal: sub, taxAmount: tax } = calculateSubtotalFromTotal(
            total,
            includeTax,
            item?.tax_rate ?? HST_RATE
        )
        setSubtotal(sub.toFixed(2))
        setTaxAmount(tax.toFixed(2))
        form.setValue(`items.${index}.subtotal`, sub, { shouldValidate: false })
        form.setValue(`items.${index}.tax_amount`, tax, { shouldValidate: false })
        form.setValue(`items.${index}.total`, total, { shouldValidate: false })
    }

    const handleTaxToggle = (checked: boolean) => {
        isTaxToggleRef.current = true
        setIncludeTax(checked)
        form.setValue(`items.${index}.tax_included`, checked, {
            shouldValidate: false,
        })
        const sub = parseFloat(subtotal) || 0
        if (sub > 0) {
            const { taxAmount: tax, total } = calculateTaxFromSubtotal(
                sub,
                checked,
                item?.tax_rate ?? HST_RATE
            )
            isInternalUpdateRef.current = true
            setTaxAmount(tax.toFixed(2))
            setTotalAmount(total.toFixed(2))
            form.setValue(`items.${index}.tax_amount`, tax, { shouldValidate: false })
            form.setValue(`items.${index}.total`, total, { shouldValidate: false })
        }
        setLastEditedField('subtotal')
    }

    const itemErrors = form.formState.errors?.items?.[index]
    const hasErrors = itemErrors && Object.keys(itemErrors).length > 0
    const isComplete =
        !!item?.description?.trim() && (item?.total ?? 0) > 0

    if (!item) return null

    return (
        <div
            className={`border rounded-lg p-4 ${
                hasErrors
                    ? 'border-red-300 dark:border-red-500/50 bg-red-50/30 dark:bg-red-500/5'
                    : isEditing
                      ? 'bg-background dark:bg-[#1a1a1a] border-border'
                      : 'bg-card dark:bg-[#131313] border-border'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        Expense Item {index + 1}
                    </h4>
                    {hasErrors && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                            Incomplete
                        </span>
                    )}
                    {!hasErrors && isComplete && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400">
                            ✓
                        </span>
                    )}
                </div>
                {isEditing && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={onRemove}
                        disabled={isDeleting}
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <VendorSection
                    index={index}
                    form={form}
                    activeSuppliers={activeSuppliers}
                    isEditing={isEditing}
                />
                <DescriptionSection index={index} form={form} isEditing={isEditing} />
                <AmountTaxSection
                    index={index}
                    form={form}
                    subtotal={subtotal}
                    taxAmount={taxAmount}
                    totalAmount={totalAmount}
                    includeTax={includeTax}
                    isEditing={isEditing}
                    onSubtotalChange={handleSubtotalChange}
                    onTotalChange={handleTotalChange}
                    onTaxToggle={handleTaxToggle}
                />
                <CategoryDateSection
                    index={index}
                    form={form}
                    isEditing={isEditing}
                />
                <WarrantySection index={index} form={form} isEditing={isEditing} />
                <PaymentMethodSection
                    index={index}
                    form={form}
                    isEditing={isEditing}
                />
                <NotesSection index={index} form={form} isEditing={isEditing} />
            </div>
        </div>
    )
}
