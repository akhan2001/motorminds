"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CreditCard, Banknote, Building2, Calendar, Receipt, Store } from "lucide-react";
import EditExpenseModal from "./EditExpenseModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatDate } from "@/app/financials/utils/format-date";
import { formatCurrency } from "@/lib/utils/currency";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    credit_card: { 
        label: "Credit Card", 
        icon: <CreditCard className="h-3 w-3" />,
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    },
    debit_card: { 
        label: "Debit", 
        icon: <CreditCard className="h-3 w-3" />,
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    },
    cash: { 
        label: "Cash", 
        icon: <Banknote className="h-3 w-3" />,
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    },
    check: { 
        label: "Check", 
        icon: <Building2 className="h-3 w-3" />,
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    },
    bank_transfer: { 
        label: "Transfer", 
        icon: <Building2 className="h-3 w-3" />,
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
    },
    other: { 
        label: "Other", 
        icon: null,
        color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    },
};

const CATEGORY_COLORS: Record<string, string> = {
    "Parts/Inventory": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Office Supplies": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    "Equipment": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    "Utilities": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Marketing": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    "Other": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

interface ExpensesTableProps {
    expenses: any[];
    onExpenseUpdated: () => void;
    onExpenseDeleted: () => void;
}

const ExpenseActions = ({ expense, onExpenseUpdated, onExpenseDeleted }: { expense: any, onExpenseUpdated: () => void, onExpenseDeleted: () => void }) => {
    const handleDelete = async () => {
        try {
            const response = await fetch('/api/financials/one-time', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: expense.id }),
            });
            if (!response.ok) throw new Error('Failed to delete');
            onExpenseDeleted();
        } catch (error) {
            console.error(error);
            alert("Failed to delete expense.");
        }
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border">
                <EditExpenseModal expense={expense} onExpenseUpdated={onExpenseUpdated} onExpenseDeleted={onExpenseDeleted}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        Edit
                    </DropdownMenuItem>
                </EditExpenseModal>
                <ConfirmationDialog
                    title="Are you sure?"
                    description="This action will permanently delete the expense and cannot be undone."
                    confirmText="Delete"
                    variant="destructive"
                    onConfirm={handleDelete}
                    trigger={
                        <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-600 dark:text-red-400"
                        >
                            Delete
                        </DropdownMenuItem>
                    }
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function ExpensesTable({ expenses, onExpenseUpdated, onExpenseDeleted }: ExpensesTableProps) {
    if (!expenses || expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No expenses have been added yet.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Track one-time purchases and expenses.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {expenses.map((expense) => {
                const paymentConfig = PAYMENT_METHOD_CONFIG[expense.payment_method] || PAYMENT_METHOD_CONFIG.other;
                const categoryColor = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;
                
                return (
                    <div 
                        key={expense.id} 
                        className="p-4 bg-white dark:bg-background rounded-lg border border-border hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-foreground truncate">{expense.cost_name}</h4>
                                    {expense.notes && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="text-xs text-muted-foreground cursor-help">📝</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    <p className="text-sm">{expense.notes}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <Badge variant="secondary" className={`text-xs ${categoryColor}`}>
                                        {expense.category}
                                    </Badge>
                                    <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${paymentConfig.color}`}>
                                        {paymentConfig.icon}
                                        {paymentConfig.label}
                                    </Badge>
                                    {expense.vendor && (
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Store className="h-3 w-3" />
                                            {expense.vendor}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="text-right">
                                    <span className="text-lg font-semibold text-foreground block">
                                        {formatCurrency(expense.amount)}
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(expense.cost_date)}
                                    </span>
                                </div>
                                <ExpenseActions expense={expense} onExpenseUpdated={onExpenseUpdated} onExpenseDeleted={onExpenseDeleted} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
