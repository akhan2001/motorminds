"use client"

import { Controller, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import SupplierDropdownSelector from '@/app/(features)/suppliers/components/supplier-dropdown-selector'
import {
    EXPENSE_CATEGORIES,
    EXPENSE_PAYMENT_METHODS,
} from '../../../../../lib/validations/work-order-expense-items'

interface FormSectionProps {
    index: number
    form: any
    isEditing: boolean
}

// ============================================================================
// VendorSection - Vendor/Supplier selection with custom option
// ============================================================================
export function VendorSection({ index, form, activeSuppliers, isEditing }: FormSectionProps & { activeSuppliers: any[] }) {
    const vendor = useWatch({ control: form.control, name: `items.${index}.expense_vendor` })
    const isCustomVendor = vendor && !activeSuppliers.find(s => s.name === vendor)

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-foreground text-sm">1. Vendor / Supplier</Label>
                <Controller
                    control={form.control}
                    name={`items.${index}.expense_vendor`}
                    render={({ field }) => (
                        <SupplierDropdownSelector
                            value={(() => {
                                const supplier = activeSuppliers.find(s => s.name === field.value)
                                if (supplier) return supplier.id
                                if (field.value) return 'custom'
                                return ''
                            })()}
                            onValueChange={(supplierId) => {
                                const selected = activeSuppliers.find(s => s.id === supplierId)
                                const vendorValue = supplierId === 'custom' ? '' : (selected?.name || '')
                                field.onChange(vendorValue)
                                form.setValue(`items.${index}.supplier`, vendorValue)
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
                        name={`items.${index}.expense_vendor`}
                        render={({ field }) => (
                            <Input
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                    field.onChange(e.target.value)
                                    form.setValue(`items.${index}.supplier`, e.target.value)
                                }}
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
                    name={`items.${index}.expense_invoice_number`}
                    render={({ field }) => (
                        <Input
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                                field.onChange(e.target.value)
                                form.setValue(`items.${index}.part_number`, e.target.value)
                            }}
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

// ============================================================================
// DescriptionSection - Expense name (simple text input)
// ============================================================================
export function DescriptionSection({ index, form, isEditing }: FormSectionProps) {
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
                            value={field.value || ''}
                            placeholder="e.g., Oil Filters - Bulk Order"
                            disabled={!isEditing}
                            className="bg-white dark:bg-background border-border"
                        />
                        {fieldState.error && (
                            <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                        )}
                    </>
                )}
            />
        </div>
    )
}

// ============================================================================
// AmountTaxSection - Subtotal, Tax, Total with tax toggle
// ============================================================================
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
    onTaxToggle 
}: {
    index: number
    form: any
    subtotal: string
    taxAmount: string
    totalAmount: string
    includeTax: boolean
    isEditing: boolean
    onSubtotalChange: (value: string) => void
    onTotalChange: (value: string) => void
    onTaxToggle: (checked: boolean) => void
}) {
    // Get the total_price field state for error display
    const totalPriceError = form.formState.errors?.items?.[index]?.total_price?.message
    
    return (
        <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">3. Amount & Tax</h4>
                <div className="flex items-center gap-2">
                    <Label htmlFor={`includeTax_${index}`} className="text-sm text-muted-foreground">
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
                    <Label htmlFor={`subtotal_${index}`} className="text-muted-foreground text-xs">
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
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <Label htmlFor={`taxAmount_${index}`} className="text-muted-foreground text-xs">
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
                    <Label htmlFor={`totalAmount_${index}`} className="text-muted-foreground text-xs">
                        Total <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`totalAmount_${index}`}
                        type="number"
                        placeholder="0.00"
                        value={totalAmount}
                        onChange={(e) => onTotalChange(e.target.value)}
                        className={`bg-white dark:bg-background border-border text-foreground font-semibold ${totalPriceError ? 'border-red-500' : ''}`}
                        disabled={!isEditing}
                        min="0"
                        step="0.01"
                    />
                    {totalPriceError && (
                        <p className="text-sm text-red-500 mt-1">{totalPriceError as string}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// CategoryDateSection - Category dropdown and date picker
// ============================================================================
export function CategoryDateSection({ index, form, isEditing }: FormSectionProps) {
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
                                value={field.value || 'Parts/Inventory'}
                                onValueChange={field.onChange}
                                disabled={!isEditing}
                            >
                                <SelectTrigger className="bg-white dark:bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldState.error && (
                                <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
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
                    name={`items.${index}.expense_cost_date`}
                    render={({ field, fieldState }) => (
                        <>
                            <Input
                                type="date"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="bg-white dark:bg-background border-border"
                                disabled={!isEditing}
                            />
                            {fieldState.error && (
                                <p className="text-sm text-red-500 mt-1">{fieldState.error.message}</p>
                            )}
                        </>
                    )}
                />
            </div>
        </div>
    )
}

// ============================================================================
// WarrantySection - Warranty input
// ============================================================================
export function WarrantySection({ index, form, isEditing }: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">4. Warranty</Label>
            <Controller
                control={form.control}
                name={`items.${index}.warranty_period`}
                render={({ field }) => (
                    <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="e.g., 1 year, Lifetime, 90 days"
                        className="bg-white dark:bg-background border-border"
                        disabled={!isEditing}
                    />
                )}
            />
        </div>
    )
}

// ============================================================================
// PaymentMethodSection - Payment method dropdown
// ============================================================================
export function PaymentMethodSection({ index, form, isEditing }: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">5. Payment Method</Label>
            <Controller
                control={form.control}
                name={`items.${index}.expense_payment_method`}
                render={({ field }) => (
                    <Select
                        value={field.value || 'credit_card'}
                        onValueChange={field.onChange}
                        disabled={!isEditing}
                    >
                        <SelectTrigger className="bg-white dark:bg-background border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {EXPENSE_PAYMENT_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
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

// ============================================================================
// NotesSection - Notes textarea
// ============================================================================
export function NotesSection({ index, form, isEditing }: FormSectionProps) {
    return (
        <div>
            <Label className="text-foreground text-sm">Notes / Comments</Label>
            <Controller
                control={form.control}
                name={`items.${index}.notes`}
                render={({ field }) => (
                    <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Additional details about this expense..."
                        className="bg-white dark:bg-background border-border min-h-[60px]"
                        disabled={!isEditing}
                    />
                )}
            />
        </div>
    )
}
