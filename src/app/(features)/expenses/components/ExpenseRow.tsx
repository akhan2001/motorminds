'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'
import type { ExpenseItem } from '../types/expenses'

interface ExpenseRowProps {
    expense: ExpenseItem
    index?: number
}

/**
 * Read-only expense row component for invoice view
 * Displays expense items from the unified expenses table in a consistent invoice format
 */
export function ExpenseRow({ expense, index }: ExpenseRowProps) {
    return (
        <div 
            key={`expense-${expense.id || index}`} 
            className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5"
        >
            <div className="col-span-5 text-foreground dark:text-white">
                <div className="flex items-center gap-2 flex-wrap">
                    <Check className="h-3 w-3 text-orange-500" />
                    <span>{expense.description}</span>
                </div>
                {expense.vendor && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Vendor: {expense.vendor}
                        {expense.invoice_number && ` - Invoice #${expense.invoice_number}`}
                    </div>
                )}
                {expense.category && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Category: {expense.category}
                    </div>
                )}
                {expense.parts_description && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Parts: {expense.parts_description}
                    </div>
                )}
                {expense.payment_method && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Payment: {expense.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                )}
                {expense.expense_date && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Date: {new Date(expense.expense_date).toLocaleDateString()}
                    </div>
                )}
                {expense.notes && (
                    <div className="text-xs text-muted-foreground dark:text-gray-500 ml-5 mt-0.5">
                        Notes: {expense.notes}
                    </div>
                )}
            </div>
            <div className="col-span-2 text-center">
                <Badge 
                    variant="outline" 
                    className="text-xs capitalize bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20"
                >
                    Expense
                </Badge>
            </div>
            <div className="col-span-2 text-center text-foreground dark:text-white">
                1
            </div>
            <div className="col-span-3 text-right text-orange-600 dark:text-orange-400 font-semibold">
                {formatCurrency(Number(expense.total ?? 0))}
            </div>
        </div>
    )
}
