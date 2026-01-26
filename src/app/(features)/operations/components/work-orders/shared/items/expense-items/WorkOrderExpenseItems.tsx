"use client"

import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useEffect, useState, useCallback, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useSuppliers } from '@/app/(features)/suppliers/hooks/use-suppliers'
import { useAuth } from '../../../../../hooks/use-auth'
import type { WorkOrderItem } from '../../../../../types/work-order-items'

import {
    WorkOrderExpenseItemsFormSchema,
    type WorkOrderExpenseItemFormData,
    type WorkOrderExpenseItemsFormData,
    createDefaultExpenseItem,
    HST_RATE,
} from '../../../../../lib/validations/work-order-expense-items'

import {
    useWorkOrderExpenseItemCreateMutation,
    useWorkOrderExpenseItemDeleteMutation,
} from '../../../../../data/work-order-items/work-order-item-expense-mutations'

import { ExpenseItemCard } from './ExpenseItemCard'

// Re-export type for backward compatibility
export type { WorkOrderExpenseItemFormData as ExpenseFormItem } from '../../../../../lib/validations/work-order-expense-items'

interface WorkOrderExpenseItemsProps {
    items: WorkOrderExpenseItemFormData[]
    onItemsChange: (items: WorkOrderExpenseItemFormData[]) => void
    workOrderId?: string
    onItemSaved?: (item: WorkOrderItem) => void
    onItemDeleted?: (itemId: string) => void
    isEditing?: boolean
}

export function WorkOrderExpenseItems({
    items,
    onItemsChange,
    workOrderId,
    onItemSaved,
    onItemDeleted,
    isEditing = true,
}: WorkOrderExpenseItemsProps) {
    const { shopId } = useAuth()
    const { suppliers } = useSuppliers()
    const activeSuppliers = suppliers.filter(s => s.status === 'active')
    const [expandingItemId, setExpandingItemId] = useState<string | null>(null)
    
    // Ref to prevent ping-pong sync between form and props
    const isInternalUpdateRef = useRef(false)
    // Ref to track the last synced items to prevent unnecessary resets
    const lastSyncedItemsRef = useRef<string>('')

    // Form setup - mode 'all' ensures validation runs on both change and blur
    // This provides immediate feedback for required fields
    const form = useForm<WorkOrderExpenseItemsFormData>({
        resolver: zodResolver(WorkOrderExpenseItemsFormSchema),
        defaultValues: { items },
        mode: 'all',
    })

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: 'items',
    })

    // Sync external items to form (only when items prop changes from parent, not from our own updates)
    useEffect(() => {
        // Skip if this is an internal update (we just sent this to parent)
        if (isInternalUpdateRef.current) {
            isInternalUpdateRef.current = false
            return
        }
        
        const itemsJson = JSON.stringify(items)
        const formItemsJson = JSON.stringify(form.getValues('items'))
        
        // Only reset if items actually changed from external source
        // AND if they're different from what we last synced
        if (itemsJson !== formItemsJson && itemsJson !== lastSyncedItemsRef.current) {
            lastSyncedItemsRef.current = itemsJson
            form.reset({ items })
        }
    }, [items, form])

    // Propagate form changes to parent
    const watchedItems = useWatch({ control: form.control, name: 'items' })
    useEffect(() => {
        if (!watchedItems) return
        
        const watchedJson = JSON.stringify(watchedItems)
        const itemsJson = JSON.stringify(items)
        
        // Only propagate if actually different
        if (watchedJson !== itemsJson) {
            // Mark as internal update to prevent sync effect from resetting form
            isInternalUpdateRef.current = true
            lastSyncedItemsRef.current = watchedJson
            onItemsChange(watchedItems)
        }
    }, [watchedItems, onItemsChange, items])
    
    // Trigger validation for all items to show errors
    const triggerValidation = useCallback(async () => {
        const result = await form.trigger()
        return result
    }, [form])

    // Mutations
    const { mutate: createItem, isPending: isCreating } = useWorkOrderExpenseItemCreateMutation({
        onSuccess: (data) => {
            toast.success('Expense item saved')
            onItemSaved?.(data)
        },
    })

    const { mutate: deleteItem, isPending: isDeleting } = useWorkOrderExpenseItemDeleteMutation({
        onSuccess: (_, variables) => {
            toast.success('Expense item deleted')
            onItemDeleted?.(variables.itemId)
        },
    })

    // Add item
    const addItem = useCallback(() => {
        if (fields.length >= 20) {
            toast.error('Maximum 20 expense items allowed')
            return
        }
        append(createDefaultExpenseItem(uuidv4()))
    }, [fields.length, append])

    // Remove item
    const removeItem = useCallback((index: number) => {
        const item = form.getValues(`items.${index}`)
        remove(index)

        if (workOrderId && item.id && !item.id.startsWith('temp-')) {
            deleteItem({ workOrderId, itemId: item.id })
        }
    }, [form, remove, workOrderId, deleteItem])

    // Handle expense from modal
    const handleExpenseFromModal = useCallback((expenseData: {
        cost_name: string
        amount: number
        subtotal: number
        tax_amount?: number
        tax_included?: boolean
        payment_method?: string
        category: string
        vendor: string | null
        invoice_number: string | null
        parts_description: string | null
        warranty: string | null
        notes: string | null
        cost_date?: string
    }) => {
        if (!expandingItemId) return

        const itemIndex = fields.findIndex(f => f.id === expandingItemId)
        if (itemIndex === -1) return

        const taxAmount = expenseData.tax_amount ?? (expenseData.subtotal * HST_RATE)
        const combinedNotes = [expenseData.parts_description, expenseData.notes]
            .filter(Boolean).join('\n')

        const updatedItem: WorkOrderExpenseItemFormData = {
            ...form.getValues(`items.${itemIndex}`),
            description: expenseData.cost_name,
            unit_price: expenseData.amount,
            total_price: expenseData.amount,
            unit_cost: expenseData.subtotal > 0 ? expenseData.subtotal : null,
            total_cost: expenseData.subtotal > 0 ? expenseData.subtotal : null,
            category: expenseData.category || 'Parts/Inventory', // Default to Parts/Inventory
            supplier: expenseData.vendor || null,
            warranty_period: expenseData.warranty || null,
            part_number: expenseData.invoice_number || null,
            notes: combinedNotes || null,
            expense_subtotal: expenseData.subtotal > 0 ? expenseData.subtotal : null,
            expense_tax_amount: taxAmount > 0 ? taxAmount : null,
            expense_tax_included: expenseData.tax_included ?? true,
            expense_payment_method: (expenseData.payment_method as any) || null,
            expense_vendor: expenseData.vendor || null,
            expense_invoice_number: expenseData.invoice_number || null,
            expense_parts_description: expenseData.parts_description || null,
            expense_cost_date: expenseData.cost_date || new Date().toISOString().split('T')[0],
            is_billable: false,
        }

        update(itemIndex, updatedItem)

        if (workOrderId) {
            createItem({ workOrderId, item: updatedItem })
        }

        setExpandingItemId(null)
    }, [expandingItemId, fields, form, update, workOrderId, createItem])

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-foreground">Expense Items</h3>
                <span className="text-sm text-muted-foreground">
                    Expenses are excluded from totals (tracking only)
                </span>
            </div>

            {/* Empty State */}
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
                            expandingItemId={expandingItemId}
                            setExpandingItemId={setExpandingItemId}
                            handleExpenseFromModal={handleExpenseFromModal}
                            isDeleting={isDeleting}
                        />
                    ))}
                </div>
            )}

            {/* Add Button */}
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
}
