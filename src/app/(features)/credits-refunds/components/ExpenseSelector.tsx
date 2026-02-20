'use client'

import React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useExpensesQuery } from '@/app/(features)/expenses/data/expenses-query'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

interface ExpenseSelectorProps {
    shopId: string | null
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    label?: string
    workOrderId?: string | null
    className?: string
    disabled?: boolean
}

/**
 * Selector for linking a credit/refund to an expense (including work order expenses).
 * Fetches shop expenses - optionally filtered by work order.
 */
export default function ExpenseSelector({
    shopId,
    value,
    onValueChange,
    placeholder = 'Link to expense (optional)',
    label = 'Related Expense',
    workOrderId,
    className,
    disabled = false,
}: ExpenseSelectorProps) {
    const { data, isLoading, error } = useExpensesQuery(shopId, {
        filters: {
            work_order_id: workOrderId || undefined,
            archived: false,
            startDate: (() => {
                const d = new Date()
                d.setFullYear(d.getFullYear() - 2)
                return d.toISOString().split('T')[0]
            })(),
            endDate: new Date().toISOString().split('T')[0],
        },
        enabled: !!shopId,
    })

    const expenses = data?.expenses ?? []

    if (isLoading) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label className="text-muted-foreground text-sm">{label}</Label>
                )}
                <Select disabled>
                    <SelectTrigger
                        className={`bg-white dark:bg-background border-border text-foreground ${className}`}
                    >
                        <SelectValue placeholder="Loading expenses..." />
                    </SelectTrigger>
                </Select>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-2">
                {label && (
                    <Label className="text-muted-foreground text-sm">{label}</Label>
                )}
                <Select disabled>
                    <SelectTrigger
                        className={`bg-white dark:bg-background border-border text-foreground ${className}`}
                    >
                        <SelectValue placeholder="Error loading expenses" />
                    </SelectTrigger>
                </Select>
                <p className="text-red-600 dark:text-red-400 text-xs">
                    {error instanceof Error ? error.message : 'Failed to load expenses'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-muted-foreground text-sm">{label}</Label>
            )}
            <Select
                value={value || 'none'}
                onValueChange={(v) => onValueChange(v === 'none' ? '' : v)}
                disabled={disabled}
            >
                <SelectTrigger
                    className={`bg-white dark:bg-background border-border text-foreground ${className}`}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">
                        <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {expenses.map((exp) => (
                        <SelectItem key={exp.id} value={exp.id}>
                            <span className="truncate">
                                {exp.description} • {exp.vendor || 'N/A'} •{' '}
                                {formatDate(exp.expense_date)} • {formatCurrency(exp.total)}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
