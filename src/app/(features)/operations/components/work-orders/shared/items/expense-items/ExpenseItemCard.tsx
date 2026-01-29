"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Trash2, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddExpenseModal from '@/app/(features)/expenses/components/AddExpenseModal'

import {
    type WorkOrderExpenseItemFormData,
    type WorkOrderExpenseItemsFormData,
    HST_RATE,
} from '../../../../../lib/validations/work-order-expense-items'

import {
    VendorSection,
    DescriptionSection,
    AmountTaxSection,
    CategoryDateSection,
    WarrantySection,
    PaymentMethodSection,
    NotesSection,
} from './ExpenseFormSections'

// Stable empty callback to prevent re-renders
const noop = () => {}

interface ExpenseItemCardProps {
    index: number
    form: ReturnType<typeof useForm<WorkOrderExpenseItemsFormData>>
    isEditing: boolean
    shopId: string
    activeSuppliers: any[]
    onRemove: () => void
    expandingItemId: string | null
    setExpandingItemId: (id: string | null) => void
    handleExpenseFromModal: (data: any) => void
    isDeleting: boolean
}

export function ExpenseItemCard({
    index,
    form,
    isEditing,
    shopId,
    activeSuppliers,
    onRemove,
    expandingItemId,
    setExpandingItemId,
    handleExpenseFromModal,
    isDeleting,
}: ExpenseItemCardProps) {
    const item = useWatch({ control: form.control, name: `items.${index}` })
    
    // Ref to track if we're updating from our own calculation (prevents infinite loop)
    const isInternalUpdateRef = useRef(false)
    // Ref to track if we're handling tax toggle (prevents calculation effect from running)
    const isTaxToggleRef = useRef(false)
    // Ref to track if we're in the middle of a calculation (prevents nested updates)
    const isCalculatingRef = useRef(false)
    // Ref to track if we're handling total change (prevents sync effect from running)
    const isHandlingTotalChangeRef = useRef(false)
    
    // Local state for Amount & Tax section (matches AddExpenseModal pattern)
    const [subtotal, setSubtotal] = useState<string>(item.expense_subtotal?.toFixed(2) || '')
    const [taxAmount, setTaxAmount] = useState<string>(item.expense_tax_amount?.toFixed(2) || '')
    const [totalAmount, setTotalAmount] = useState<string>(item.total_price?.toFixed(2) || '')
    const [includeTax, setIncludeTax] = useState<boolean>(item.expense_tax_included ?? true)
    const [lastEditedField, setLastEditedField] = useState<'subtotal' | 'total'>('subtotal')

    // Sync form values to local state when item changes (only if not from internal update)
    useEffect(() => {
        // Skip if we're calculating or handling total change (prevents sync during calculations)
        if (isCalculatingRef.current || isHandlingTotalChangeRef.current) {
            // Reset flags for next cycle
            isHandlingTotalChangeRef.current = false
            isCalculatingRef.current = false
            return
        }
        
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false
            return
        }
        
        const newSubtotal = item.expense_subtotal?.toFixed(2) || ''
        const newTaxAmount = item.expense_tax_amount?.toFixed(2) || ''
        const newTotalAmount = item.total_price?.toFixed(2) || ''
        const newIncludeTax = item.expense_tax_included ?? true
        
        // Use functional updates to only update if values actually changed
        setSubtotal(prev => prev !== newSubtotal ? newSubtotal : prev)
        setTaxAmount(prev => prev !== newTaxAmount ? newTaxAmount : prev)
        setTotalAmount(prev => prev !== newTotalAmount ? newTotalAmount : prev)
        setIncludeTax(prev => prev !== newIncludeTax ? newIncludeTax : prev)
    }, [item.expense_subtotal, item.expense_tax_amount, item.total_price, item.expense_tax_included])

    // Calculate based on which field was last edited (matches AddExpenseModal pattern)
    useEffect(() => {
        // Skip if we're already calculating (prevents nested updates)
        if (isCalculatingRef.current) {
            return
        }
        
        // Skip if we're handling tax toggle (it does its own calculation)
        if (isTaxToggleRef.current) {
            isTaxToggleRef.current = false
            return
        }
        
        // Only calculate when subtotal was the last edited field
        // If total was edited, handleTotalChange does the calculation directly
        if (lastEditedField !== 'subtotal') {
            return
        }
        
        if (subtotal !== '') {
            // Mark that we're calculating to prevent nested updates
            isCalculatingRef.current = true
            
            try {
                // Calculate total from subtotal
                const sub = parseFloat(subtotal) || 0
                if (includeTax && sub > 0) {
                    const tax = sub * HST_RATE
                    const total = sub + tax
                    const roundedTax = parseFloat(tax.toFixed(2)) // Round to 2 decimal places
                    const roundedTotal = parseFloat(total.toFixed(2)) // Round to 2 decimal places
                    setTaxAmount(tax.toFixed(2))
                    setTotalAmount(total.toFixed(2))
                    
                    // Mark as internal update to prevent sync effect from running
                    isInternalUpdateRef.current = true
                    
                    // Update form values with rounded values (ensure proper types)
                    form.setValue(`items.${index}.expense_subtotal`, sub > 0 ? sub : null, { shouldValidate: false })
                    form.setValue(`items.${index}.expense_tax_amount`, roundedTax > 0 ? roundedTax : null, { shouldValidate: false })
                    form.setValue(`items.${index}.unit_price`, roundedTotal, { shouldValidate: false })
                    form.setValue(`items.${index}.unit_cost`, sub > 0 ? sub : null, { shouldValidate: false })
                    form.setValue(`items.${index}.total_price`, roundedTotal * (item.quantity || 1), { shouldValidate: false })
                    form.setValue(`items.${index}.total_cost`, sub > 0 ? sub * (item.quantity || 1) : null, { shouldValidate: false })
                } else if (sub > 0) {
                    setTaxAmount('0.00')
                    setTotalAmount(sub.toFixed(2))
                    
                    // Mark as internal update to prevent sync effect from running
                    isInternalUpdateRef.current = true
                    
                    // Update form values (ensure proper types)
                    form.setValue(`items.${index}.expense_subtotal`, sub > 0 ? sub : null, { shouldValidate: false })
                    form.setValue(`items.${index}.expense_tax_amount`, null, { shouldValidate: false })
                    form.setValue(`items.${index}.unit_price`, sub, { shouldValidate: false })
                    form.setValue(`items.${index}.unit_cost`, sub > 0 ? sub : null, { shouldValidate: false })
                    form.setValue(`items.${index}.total_price`, sub * (item.quantity || 1), { shouldValidate: false })
                    form.setValue(`items.${index}.total_cost`, sub > 0 ? sub * (item.quantity || 1) : null, { shouldValidate: false })
                }
            } finally {
                // Reset calculation flag
                isCalculatingRef.current = false
            }
        }
    }, [subtotal, includeTax, lastEditedField, form, index, item.quantity])

    // Handle subtotal change (matches AddExpenseModal pattern)
    const handleSubtotalChange = (value: string) => {
        setLastEditedField('subtotal')
        setSubtotal(value)
    }

    // Handle total change - reverse calculate subtotal (matches AddExpenseModal pattern)
    const handleTotalChange = (value: string) => {
        // Mark that we're handling total change to prevent effects from running
        isHandlingTotalChangeRef.current = true
        isCalculatingRef.current = true
        isInternalUpdateRef.current = true
        
        setLastEditedField('total')
        setTotalAmount(value)
        
        const total = parseFloat(value) || 0
        if (includeTax && total > 0) {
            const sub = total / (1 + HST_RATE)
            const tax = sub * HST_RATE // Always calculate HST as exactly 13% of subtotal
            const roundedSub = parseFloat(sub.toFixed(2)) // Round to 2 decimal places
            const roundedTax = parseFloat(tax.toFixed(2)) // Round to 2 decimal places
            setSubtotal(sub.toFixed(2))
            setTaxAmount(tax.toFixed(2))
            
            // Update form values with rounded values (ensure proper types)
            form.setValue(`items.${index}.expense_subtotal`, roundedSub > 0 ? roundedSub : null, { shouldValidate: false })
            form.setValue(`items.${index}.expense_tax_amount`, roundedTax > 0 ? roundedTax : null, { shouldValidate: false })
            form.setValue(`items.${index}.unit_price`, total, { shouldValidate: false })
            form.setValue(`items.${index}.unit_cost`, roundedSub > 0 ? roundedSub : null, { shouldValidate: false })
            form.setValue(`items.${index}.total_price`, total, { shouldValidate: false })
            form.setValue(`items.${index}.total_cost`, roundedSub > 0 ? roundedSub : null, { shouldValidate: false })
        } else {
            setSubtotal(value)
            setTaxAmount('0.00')
            
            // Update form values (ensure proper types)
            form.setValue(`items.${index}.expense_subtotal`, total > 0 ? total : null, { shouldValidate: false })
            form.setValue(`items.${index}.expense_tax_amount`, null, { shouldValidate: false })
            form.setValue(`items.${index}.unit_price`, total, { shouldValidate: false })
            form.setValue(`items.${index}.unit_cost`, total > 0 ? total : null, { shouldValidate: false })
            form.setValue(`items.${index}.total_price`, total, { shouldValidate: false })
            form.setValue(`items.${index}.total_cost`, total > 0 ? total : null, { shouldValidate: false })
        }
        
        // Note: Flags will be reset by the sync effect when it sees isInternalUpdateRef.current = true
        // The other flags will persist until the next calculation cycle, preventing loops
    }

    // Handle tax toggle (matches AddExpenseModal pattern)
    const handleTaxToggle = (checked: boolean) => {
        // Mark that we're handling tax toggle to prevent calculation effect from running
        isTaxToggleRef.current = true
        
        setIncludeTax(checked)
        
        // Mark as internal update to prevent sync effect from running
        isInternalUpdateRef.current = true
        
        form.setValue(`items.${index}.expense_tax_included`, checked)
        
        // Calculate directly based on current subtotal (don't rely on effect)
        const sub = parseFloat(subtotal) || 0
        if (checked && sub > 0) {
            // Tax is now included - calculate tax and total
            const tax = sub * HST_RATE
            const total = sub + tax
            const roundedTax = parseFloat(tax.toFixed(2))
            const roundedTotal = parseFloat(total.toFixed(2))
            
            setTaxAmount(tax.toFixed(2))
            setTotalAmount(total.toFixed(2))
            
            // Update form values (ensure proper types)
            form.setValue(`items.${index}.expense_subtotal`, sub > 0 ? sub : null, { shouldValidate: false })
            form.setValue(`items.${index}.expense_tax_amount`, roundedTax > 0 ? roundedTax : null, { shouldValidate: false })
            form.setValue(`items.${index}.unit_price`, roundedTotal, { shouldValidate: false })
            form.setValue(`items.${index}.unit_cost`, sub > 0 ? sub : null, { shouldValidate: false })
            form.setValue(`items.${index}.total_price`, roundedTotal * (item.quantity || 1), { shouldValidate: false })
            form.setValue(`items.${index}.total_cost`, sub > 0 ? sub * (item.quantity || 1) : null, { shouldValidate: false })
        } else if (sub > 0) {
            // Tax is now excluded - remove tax
            setTaxAmount('0.00')
            setTotalAmount(sub.toFixed(2))
            
            // Update form values (ensure proper types)
            form.setValue(`items.${index}.expense_subtotal`, sub > 0 ? sub : null, { shouldValidate: false })
            form.setValue(`items.${index}.expense_tax_amount`, null, { shouldValidate: false })
            form.setValue(`items.${index}.unit_price`, sub, { shouldValidate: false })
            form.setValue(`items.${index}.unit_cost`, sub > 0 ? sub : null, { shouldValidate: false })
            form.setValue(`items.${index}.total_price`, sub * (item.quantity || 1), { shouldValidate: false })
            form.setValue(`items.${index}.total_cost`, sub > 0 ? sub * (item.quantity || 1) : null, { shouldValidate: false })
        }
        
        // Update lastEditedField to maintain state consistency
        setLastEditedField('subtotal')
    }

    // Check if this item has validation errors
    const itemErrors = form.formState.errors?.items?.[index]
    const hasErrors = itemErrors && Object.keys(itemErrors).length > 0
    
    // Check if the item is complete (has required fields filled)
    const isComplete = item.description?.trim() && item.total_price > 0

    return (
        <div className={`border rounded-lg p-4 ${
            hasErrors 
                ? 'border-red-300 dark:border-red-500/50 bg-red-50/30 dark:bg-red-500/5'
                : isEditing 
                    ? 'bg-background dark:bg-[#1a1a1a] border-border' 
                    : 'bg-card dark:bg-[#131313] border-border'
        }`}>
            {/* Header */}
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
                    <div className="flex items-center gap-1">
                        <AddExpenseModal
                            shopId={shopId}
                            onExpenseAdded={noop}
                            onWorkOrderExpenseCreated={handleExpenseFromModal}
                            open={expandingItemId === item.id}
                            onOpenChange={(open) => setExpandingItemId(open ? item.id : null)}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Expand to detailed form"
                            >
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </AddExpenseModal>
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
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <VendorSection 
                    index={index} 
                    form={form} 
                    activeSuppliers={activeSuppliers} 
                    isEditing={isEditing} 
                />
                <DescriptionSection 
                    index={index} 
                    form={form} 
                    isEditing={isEditing} 
                />
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
                <CategoryDateSection index={index} form={form} isEditing={isEditing} />
                <WarrantySection index={index} form={form} isEditing={isEditing} />
                <PaymentMethodSection index={index} form={form} isEditing={isEditing} />
                <NotesSection index={index} form={form} isEditing={isEditing} />
            </div>
        </div>
    )
}
