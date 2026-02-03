'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateOnly } from '@/lib/utils/date'
import type { ExpenseItem } from '../types/expenses'

interface ExpenseSummaryCardProps {
    expense: ExpenseItem
    /** Whether the details section is expanded by default. Default: true */
    defaultExpanded?: boolean
}

/**
 * Read-only expense card component for cost summary and financial summary displays.
 * Displays expense items from the unified expenses table in a consistent card format.
 * Collapsible: click the header row to expand/collapse details.
 */
export function ExpenseSummaryCard({ expense, defaultExpanded = true }: ExpenseSummaryCardProps) {
    const [open, setOpen] = useState(defaultExpanded)

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="p-3 rounded-lg border border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5">
                <CollapsibleTrigger asChild>
                    <div className="flex justify-between items-start gap-2 cursor-pointer hover:opacity-90 transition-opacity group">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-medium px-2 py-1 rounded border bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20">
                                    EXPENSE
                                </span>
                                <span className="text-xs font-medium px-2 py-1 rounded border bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/20">
                                    TRACKING ONLY
                                </span>
                            </div>
                            <h4 className="font-medium text-foreground">{expense.description}</h4>
                            {expense.invoice_number && (
                                <p className="text-xs text-muted-foreground">Invoice #: {expense.invoice_number}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right text-foreground">
                                <div className="font-semibold">{formatCurrency(Number(expense.total ?? 0))}</div>
                            </div>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden>
                                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                        </div>
                    </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="space-y-1 text-sm text-muted-foreground pt-2 mt-2 border-t border-orange-200 dark:border-orange-500/20">
                        <div className="flex justify-between">
                            <div>
                                <span>1 × {formatCurrency(Number(expense.total ?? 0))}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {expense.tax_amount && Number(expense.tax_amount) > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Tax: </span>
                                    <span className="text-foreground">
                                        {formatCurrency(Number(expense.tax_amount))} {expense.tax_included ? '(incl.)' : ''}
                                    </span>
                                </div>
                            )}
                            {expense.vendor && (
                                <div>
                                    <span className="text-muted-foreground">Vendor: </span>
                                    <span className="text-foreground">{expense.vendor}</span>
                                </div>
                            )}
                            {expense.subtotal && Number(expense.subtotal) > 0 && (
                                <div>
                                    <span className="text-muted-foreground">Subtotal: </span>
                                    <span className="text-foreground">{formatCurrency(Number(expense.subtotal))}</span>
                                </div>
                            )}
                            {expense.payment_method && (
                                <div>
                                    <span className="text-muted-foreground">Payment: </span>
                                    <span className="text-foreground">
                                        {expense.payment_method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </span>
                                </div>
                            )}
                            {expense.expense_date && (
                                <div>
                                    <span className="text-muted-foreground">Date: </span>
                                    <span className="text-foreground">{formatDateOnly(expense.expense_date)}</span>
                                </div>
                            )}
                            {expense.category && (
                                <div>
                                    <span className="text-muted-foreground">Category: </span>
                                    <span className="text-foreground">{expense.category}</span>
                                </div>
                            )}
                            {expense.warranty_period && (
                                <div>
                                    <span className="text-muted-foreground">Warranty: </span>
                                    <span className="text-foreground">{expense.warranty_period}</span>
                                </div>
                            )}
                        </div>

                        {expense.parts_description && (
                            <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                                <span className="font-medium">Parts Description: </span>
                                <span>{expense.parts_description}</span>
                            </div>
                        )}

                        {expense.notes && (
                            <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                                <span className="font-medium">Notes: </span>
                                <span>{expense.notes}</span>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    )
}
