// Unified items section component
'use client'

import React, { forwardRef, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Direct imports for better tree-shaking (Supabase pattern - no barrel exports)
import { WorkOrderLaborItems } from '../shared/items/WorkOrderLaborItems'
import { WorkOrderPartsItems } from '../shared/items/WorkOrderPartsItems'
import { ExpenseItemsList, type ExpenseItemsListRef } from '@/app/(features)/expenses/components/ExpenseItemsList'
import { useExpensesByWorkOrder } from '@/app/(features)/expenses/hooks/use-expenses'
import { WorkOrderGenericItems } from '../shared/items/WorkOrderGenericItems'
import { formatCurrency } from '@/lib/utils/currency'
import type { LaborFormItem, PartFormItem, ExpenseFormItem, GenericFormItem } from './hooks/use-work-order-item-management'
import type { ExpenseListItemFormData } from '@/app/(features)/expenses/lib/validations/expense-schema'
import type { ExpenseListItemFormData } from '@/app/(features)/expenses/lib/validations/expense-schema'
import { partToExpenseItem } from '../../../lib/part-to-expense'
import { formItemsToLiveWorkOrderItems } from './hooks/use-work-order-item-management'
import { calculateInvoiceTotals } from '@/app/(features)/financials/lib/invoice-calculations'

interface WorkOrderItemsSectionProps {
    itemsByType: {
        labor: LaborFormItem[]
        parts: PartFormItem[]
        expenses: ExpenseFormItem[]
        services: GenericFormItem[]
        fees: GenericFormItem[]
        discounts: GenericFormItem[]
        packages: GenericFormItem[]
    }
    onItemsChange: (type: 'labor' | 'part' | 'expense' | 'service' | 'fee' | 'discount' | 'package', items: any[]) => void
    workOrderId: string
    isEditing: boolean
    onItemSaved?: (item: any) => void
    onItemDeleted?: (itemId: string) => void
}

export const WorkOrderItemsSection = forwardRef<ExpenseItemsListRef, WorkOrderItemsSectionProps>(function WorkOrderItemsSection({
    itemsByType,
    onItemsChange,
    workOrderId,
    isEditing,
    onItemSaved,
    onItemDeleted,
}, ref) {
    const [partIdsWithExpense, setPartIdsWithExpense] = useState<Set<string>>(new Set())
    const { data: workOrderExpenses = [] } = useExpensesByWorkOrder(workOrderId)
    const expensesTotalFromTable = useMemo(
        () =>
            workOrderExpenses.reduce(
                (sum, e) => sum + Number(e.total ?? 0),
                0
            ),
        [workOrderExpenses]
    )

    // Check if there are any legacy items that need to be shown for deletion
    const hasLegacyServices = itemsByType.services.length > 0
    const hasLegacyFees = itemsByType.fees.length > 0
    const hasLegacyPackages = itemsByType.packages.length > 0

    // Calculate live totals from local (unsaved) state using the SAME calculation as the
    // saved work order and the invoice: declined items excluded, expenses tracking-only,
    // line discounts and discount rows subtracted.
    const liveTotals = useMemo(() => {
        const liveItems = formItemsToLiveWorkOrderItems(itemsByType, workOrderId, '')
        const calc = calculateInvoiceTotals(liveItems)
        const taxRate = 0.13
        const taxAmount = calc.subtotal * taxRate

        return {
            laborTotal: calc.labourTotal,
            partsTotal: calc.partsTotal,
            expensesTotal: expensesTotalFromTable,
            servicesTotal: calc.servicesTotal,
            feesTotal: calc.feesTotal,
            discountsTotal: calc.discountsTotal,
            packagesTotal: calc.packagesTotal,
            subtotal: calc.subtotal,
            taxAmount,
            total: calc.subtotal + taxAmount,
            hasItems: calc.approvedItems.some(i => i.item_type !== 'expense'),
        }
    }, [itemsByType, workOrderId, expensesTotalFromTable])

    // Memoized callbacks to prevent unnecessary re-renders of child components
    const handleLaborChange = useCallback((items: LaborFormItem[]) => {
        onItemsChange('labor', items)
    }, [onItemsChange])

    const handlePartsChange = useCallback((items: PartFormItem[]) => {
        onItemsChange('part', items)
    }, [onItemsChange])


    const handleServicesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('service', items)
    }, [onItemsChange])

    const handleFeesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('fee', items)
    }, [onItemsChange])

    const handleDiscountsChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('discount', items)
    }, [onItemsChange])

    const handlePackagesChange = useCallback((items: GenericFormItem[]) => {
        onItemsChange('package', items)
    }, [onItemsChange])

    const handleCreateExpenseFromPart = useCallback(
        (part: PartFormItem, partIndex: number) => {
            if (partIdsWithExpense.has(part.id)) {
                toast.error('This part already has an expense')
                return
            }
            const expenseItem = partToExpenseItem(part, partIndex)
            const appended = (ref as React.RefObject<ExpenseItemsListRef | null>)?.current?.appendItem(expenseItem)
            if (!appended) {
                toast.error('Maximum 20 expense items allowed')
                return
            }
            setPartIdsWithExpense((prev) => new Set(prev).add(part.id))
            toast.success('Expense created from part')
        },
        [partIdsWithExpense, ref]
    )

    const handleExpenseItemRemoved = useCallback((item: ExpenseListItemFormData) => {
        if (item.sourcePartId) {
            setPartIdsWithExpense((prev) => {
                const next = new Set(prev)
                next.delete(item.sourcePartId!)
                return next
            })
        }
    }, [])

    return (
        <div className="bg-slate-50 dark:bg-[#131313] border border-border rounded-lg p-4 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Work Order Items</h3>

            <WorkOrderLaborItems
                items={itemsByType.labor}
                onItemsChange={handleLaborChange}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            <WorkOrderPartsItems
                items={itemsByType.parts}
                onItemsChange={handlePartsChange}
                workOrderId={workOrderId}
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
                onCreateExpenseFromPart={handleCreateExpenseFromPart}
                partIdsWithExpense={partIdsWithExpense}
            />

            <ExpenseItemsList
                ref={ref}
                workOrderId={workOrderId}
                sourceType="work_order"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
                onItemRemoved={handleExpenseItemRemoved}
            />

            {/* Show legacy Services only if they exist - read-only with delete capability */}
            {hasLegacyServices && (
                <WorkOrderGenericItems
                    items={itemsByType.services}
                    onItemsChange={handleServicesChange}
                    workOrderId={workOrderId}
                    itemType="service"
                    title="Services (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}

            {/* Show legacy Fees only if they exist - read-only with delete capability */}
            {hasLegacyFees && (
                <WorkOrderGenericItems
                    items={itemsByType.fees}
                    onItemsChange={handleFeesChange}
                    workOrderId={workOrderId}
                    itemType="fee"
                    title="Fees (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}

            <WorkOrderGenericItems
                items={itemsByType.discounts}
                onItemsChange={handleDiscountsChange}
                workOrderId={workOrderId}
                itemType="discount"
                title="Discounts"
                isEditing={isEditing}
                onItemSaved={onItemSaved}
                onItemDeleted={onItemDeleted}
            />

            {/* Show legacy Packages only if they exist - read-only with delete capability */}
            {hasLegacyPackages && (
                <WorkOrderGenericItems
                    items={itemsByType.packages}
                    onItemsChange={handlePackagesChange}
                    workOrderId={workOrderId}
                    itemType="package"
                    title="Packages (Legacy)"
                    isEditing={isEditing}
                    onItemSaved={onItemSaved}
                    onItemDeleted={onItemDeleted}
                    readOnly={true}
                />
            )}

            {/* Live Running Total - Updates in real-time as user edits */}
            {liveTotals.hasItems && (
                <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Running Total</h4>
                    <div className="space-y-1 text-sm">
                        {liveTotals.laborTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Labor/Services</span>
                                <span className="text-foreground">{formatCurrency(liveTotals.laborTotal)}</span>
                            </div>
                        )}
                        {liveTotals.partsTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Parts</span>
                                <span className="text-foreground">{formatCurrency(liveTotals.partsTotal)}</span>
                            </div>
                        )}
                        {liveTotals.expensesTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-orange-500">Expenses (Tracking Only)</span>
                                <span className="text-orange-500">{formatCurrency(liveTotals.expensesTotal)}</span>
                            </div>
                        )}
                        {liveTotals.servicesTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Services (Legacy)</span>
                                <span className="text-foreground">{formatCurrency(liveTotals.servicesTotal)}</span>
                            </div>
                        )}
                        {liveTotals.feesTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fees</span>
                                <span className="text-foreground">{formatCurrency(liveTotals.feesTotal)}</span>
                            </div>
                        )}
                        {liveTotals.discountsTotal > 0 && (
                            <div className="flex justify-between">
                                <span className="text-red-500">Discounts</span>
                                <span className="text-red-500">-{formatCurrency(liveTotals.discountsTotal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border">
                            <span className="text-foreground font-medium">Subtotal</span>
                            <span className="text-foreground font-medium">{formatCurrency(liveTotals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tax (13%)</span>
                            <span className="text-foreground">{formatCurrency(liveTotals.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border font-semibold">
                            <span className="text-foreground">Total</span>
                            <span className="text-green-600 dark:text-green-400">{formatCurrency(liveTotals.total)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

