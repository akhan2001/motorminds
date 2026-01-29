'use client'

import { Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import SupplierDropdownSelector from '@/app/(features)/suppliers/components/supplier-dropdown-selector'
import {
    EXPENSE_PAYMENT_METHODS,
    EXPENSE_CATEGORIES,
} from '../lib/validations/expense-schema'
import type { ExpenseListFormData } from '../lib/validations/expense-schema'

interface FormSectionProps {
    index: number
    form: { control: any; setValue: any; formState: { errors?: any } }
    isEditing: boolean
    activeSuppliers?: { id: string; name: string }[]
}

export function VendorSection({
    index,
    form,
    activeSuppliers = [],
    isEditing,
}: FormSectionProps & { activeSuppliers: { id: string; name: string }[] }) {
    const vendor = useWatch({
        control: form.control,
        name: `items.${index}.vendor`,
    })
    const isCustomVendor = vendor && !activeSuppliers.find((s) => s.name === vendor)

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-foreground text-sm">1. Vendor / Supplier</Label>
                <Controller
                    control={form.control}
                    name={`items.${index}.vendor`}
                    render={({ field }) => (
                        <SupplierDropdownSelector
                            value={
                                activeSuppliers.find((s) => s.name === field.value)?.id ??
                                (field.value ? 'custom' : '')
                            }
                            onValueChange={(supplierId: string) => {
                                const selected = activeSuppliers.find(
                                    (s) => s.id === supplierId
                                )
                                field.onChange(
                                    supplierId === 'custom' ? '' : selected?.name ?? ''
                                )
                            }}
                            placeholder="Select a supplier..."
                            showCustomOption={true}
                            customOptionValue="custom"
                            customOptionLabel="Enter Custom Vendor"
                            className="bg-white dark:bg-background border-border"
                            disabled={!isEditing}
                        />
                    )}
                />
            </div>
            {isCustomVendor && (
                <div>
                    <Label className="text-foreground text-sm">Custom Vendor Name</Label>
                    <Controller
                        control={form.control}
                        name={`items.${index}.vendor`}
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="e.g., AutoZone, O'Reilly, NAPA"
                                className="bg-white dark:bg-background border-border"
                                disabled={!isEditing}
                            />
                        )}
                    />
                </div>
            )}
            <div>
                <Label className="text-foreground text-sm">2. Invoice #</Label>
                <Controller
                    control={form.control}
                    name={`items.${index}.invoice_number`}
                    render={({ field }) => (
                        <Input
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="Vendor invoice number"
                            className="bg-white dark:bg-background border-border"
                            disabled={!isEditing}
                        />
                    )}
                />
            </div>
        </div>
    )
}

export function DescriptionSection({
    index,
    form,
    isEditing,
}: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">
                Expense Name <span className="text-red-500">*</span>
            </Label>
            <Controller
                control={form.control}
                name={`items.${index}.description`}
                render={({ field, fieldState }) => (
                    <>
                        <Input
                            {...field}
                            value={field.value ?? ''}
                            placeholder="e.g., Oil Filters - Bulk Order"
                            disabled={!isEditing}
                            className="bg-white dark:bg-background border-border"
                        />
                        {fieldState.error && (
                            <p className="text-sm text-red-500 mt-1">
                                {fieldState.error.message}
                            </p>
                        )}
                    </>
                )}
            />
        </div>
    )
}

export function AmountTaxSection({
    index,
    form,
    subtotal,
    taxAmount,
    totalAmount,
    includeTax,
    isEditing,
    onSubtotalChange,
    onTotalChange,
    onTaxToggle,
}: FormSectionProps & {
    subtotal: string
    taxAmount: string
    totalAmount: string
    includeTax: boolean
    onSubtotalChange: (value: string) => void
    onTotalChange: (value: string) => void
    onTaxToggle: (checked: boolean) => void
}) {
    const totalError = form.formState?.errors?.items?.[index]?.total?.message

    return (
        <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">3. Amount & Tax</h4>
                <div className="flex items-center gap-2">
                    <Label
                        htmlFor={`includeTax_${index}`}
                        className="text-sm text-muted-foreground"
                    >
                        Include HST (13%)
                    </Label>
                    <Switch
                        id={`includeTax_${index}`}
                        checked={includeTax}
                        onCheckedChange={onTaxToggle}
                        disabled={!isEditing}
                    />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <Label
                        htmlFor={`subtotal_${index}`}
                        className="text-muted-foreground text-xs"
                    >
                        Subtotal
                    </Label>
                    <Input
                        id={`subtotal_${index}`}
                        type="number"
                        placeholder="0.00"
                        value={subtotal}
                        onChange={(e) => onSubtotalChange(e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        disabled={!isEditing}
                        min={0}
                        step={0.01}
                    />
                </div>
                <div>
                    <Label
                        htmlFor={`taxAmount_${index}`}
                        className="text-muted-foreground text-xs"
                    >
                        HST (13%)
                    </Label>
                    <Input
                        id={`taxAmount_${index}`}
                        type="number"
                        placeholder="0.00"
                        value={taxAmount}
                        readOnly
                        className="bg-muted/50 dark:bg-muted/20 border-border text-foreground cursor-not-allowed"
                    />
                </div>
                <div>
                    <Label
                        htmlFor={`totalAmount_${index}`}
                        className="text-muted-foreground text-xs"
                    >
                        Total <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`totalAmount_${index}`}
                        type="number"
                        placeholder="0.00"
                        value={totalAmount}
                        onChange={(e) => onTotalChange(e.target.value)}
                        className={`bg-white dark:bg-background border-border text-foreground font-semibold ${totalError ? 'border-red-500' : ''}`}
                        disabled={!isEditing}
                        min={0}
                        step={0.01}
                    />
                    {totalError && (
                        <p className="text-sm text-red-500 mt-1">{String(totalError)}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export function CategoryDateSection({
    index,
    form,
    isEditing,
}: FormSectionProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label className="text-foreground text-sm">
                    Category <span className="text-red-500">*</span>
                </Label>
                <Controller
                    control={form.control}
                    name={`items.${index}.category`}
                    render={({ field, fieldState }) => (
                        <>
                            <Select
                                value={field.value ?? ''}
                                onValueChange={field.onChange}
                                disabled={!isEditing}
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
                                <p className="text-sm text-red-500 mt-1">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </>
                    )}
                />
            </div>
            <div>
                <Label className="text-foreground text-sm">
                    Date <span className="text-red-500">*</span>
                </Label>
                <Controller
                    control={form.control}
                    name={`items.${index}.expense_date`}
                    render={({ field, fieldState }) => (
                        <>
                            <Input
                                type="date"
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                className="bg-white dark:bg-background border-border"
                                disabled={!isEditing}
                            />
                            {fieldState.error && (
                                <p className="text-sm text-red-500 mt-1">
                                    {fieldState.error.message}
                                </p>
                            )}
                        </>
                    )}
                />
            </div>
        </div>
    )
}

export function WarrantySection({
    index,
    form,
    isEditing,
}: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">4. Warranty</Label>
            <Controller
                control={form.control}
                name={`items.${index}.warranty_period`}
                render={({ field }) => (
                    <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="e.g., 1 year, Lifetime, 90 days"
                        className="bg-white dark:bg-background border-border"
                        disabled={!isEditing}
                    />
                )}
            />
        </div>
    )
}

export function PaymentMethodSection({
    index,
    form,
    isEditing,
}: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">5. Payment Method</Label>
            <Controller
                control={form.control}
                name={`items.${index}.payment_method`}
                render={({ field }) => (
                    <Select
                        value={field.value ?? 'credit_card'}
                        onValueChange={field.onChange}
                        disabled={!isEditing}
                    >
                        <SelectTrigger className="bg-white dark:bg-background border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPENSE_PAYMENT_METHODS.map((method) => (
                                <SelectItem
                                    key={method.value}
                                    value={method.value}
                                >
                                    {method.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
        </div>
    )
}

export function NotesSection({
    index,
    form,
    isEditing,
}: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">Notes / Comments</Label>
            <Controller
                control={form.control}
                name={`items.${index}.notes`}
                render={({ field }) => (
                    <Textarea
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Additional details about this expense..."
                        className="bg-white dark:bg-background border-border min-h-[60px]"
                        disabled={!isEditing}
                    />
                )}
            />
        </div>
    )
}
