"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CreditCard, Banknote, Building2 } from "lucide-react";
import EditExpenseModal from "./EditExpenseModal";
import { ConfirmationDialog } from "../../components/ConfirmationDialog";
import { formatDate } from "@/app/financials/utils/format-date";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value || 0);

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
    credit_card: { label: "Credit Card", icon: <CreditCard className="h-3 w-3" /> },
    debit_card: { label: "Debit Card", icon: <CreditCard className="h-3 w-3" /> },
    cash: { label: "Cash", icon: <Banknote className="h-3 w-3" /> },
    check: { label: "Check", icon: <Building2 className="h-3 w-3" /> },
    bank_transfer: { label: "Bank Transfer", icon: <Building2 className="h-3 w-3" /> },
    other: { label: "Other", icon: null },
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
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
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
        return <p className="text-center text-muted-foreground py-4">No expenses have been added yet.</p>;
    }
    return (
        <div className="overflow-x-auto max-h-96">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/50">
                    <TableRow>
                        <TableHead className="text-foreground">Expense Name</TableHead>
                        <TableHead className="text-foreground">Vendor</TableHead>
                        <TableHead className="text-foreground">Category</TableHead>
                        <TableHead className="text-foreground">Payment</TableHead>
                        <TableHead className="text-right text-foreground">Amount</TableHead>
                        <TableHead className="text-foreground">Date</TableHead>
                        <TableHead className="text-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map((expense, idx) => {
                        const paymentInfo = PAYMENT_METHOD_LABELS[expense.payment_method] || PAYMENT_METHOD_LABELS.other;
                        
                        return (
                            <TableRow key={expense.id} className={idx % 2 === 0 ? "bg-white dark:bg-background" : "bg-slate-50 dark:bg-muted/30"}>
                                <TableCell className="text-foreground">
                                    <div>
                                        <span className="font-medium">{expense.cost_name}</span>
                                        {expense.notes && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="ml-2 text-xs text-muted-foreground cursor-help">📝</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="text-sm">{expense.notes}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-foreground">
                                    {expense.vendor || <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell className="text-foreground">{expense.category}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                                        {paymentInfo.icon}
                                        {paymentInfo.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-foreground font-medium">
                                    {formatCurrency(expense.amount)}
                                </TableCell>
                                <TableCell className="text-foreground">{formatDate(expense.cost_date)}</TableCell>
                                <TableCell>
                                    <ExpenseActions expense={expense} onExpenseUpdated={onExpenseUpdated} onExpenseDeleted={onExpenseDeleted} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
