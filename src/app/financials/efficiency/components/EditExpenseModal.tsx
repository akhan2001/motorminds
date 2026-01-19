"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EditExpenseModalProps {
    expense: any;
    onExpenseUpdated: () => void;
    onExpenseDeleted?: () => void;
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const PAYMENT_METHODS = [
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "cash", label: "Cash" },
    { value: "check", label: "Check" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "other", label: "Other" },
];

const EXPENSE_CATEGORIES = [
    "Parts/Inventory",
    "Tools/Equipment",
    "Repairs/Maintenance",
    "Training/Certification",
    "Marketing/Advertising",
    "Legal/Consulting",
    "Office Supplies",
    "Utilities",
    "Rent/Lease",
    "Insurance",
    "Other",
];

export default function EditExpenseModal({
    expense,
    onExpenseUpdated,
    onExpenseDeleted,
    children,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: EditExpenseModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    
    // Support both controlled and uncontrolled modes
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled 
        ? (open: boolean) => controlledOnOpenChange?.(open)
        : setInternalOpen;
    const [expenseName, setExpenseName] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [expenseDate, setExpenseDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("credit_card");
    const [vendor, setVendor] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (expense) {
            setExpenseName(expense.cost_name || "");
            setAmount(String(expense.amount || ""));
            setCategory(expense.category || "Other");
            setExpenseDate(expense.cost_date ? new Date(expense.cost_date).toISOString().split("T")[0] : "");
            setPaymentMethod(expense.payment_method || "credit_card");
            setVendor(expense.vendor || "");
            setNotes(expense.notes || "");
        }
    }, [expense]);

    const handleSubmit = async () => {
        setError("");
        if (!expenseName || !amount || !category || !expenseDate) {
            setError("Please fill out all required fields.");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/financials/one-time", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: expense.id,
                    cost_name: expenseName,
                    amount: parseFloat(amount),
                    category,
                    cost_date: expenseDate,
                    payment_method: paymentMethod,
                    vendor: vendor.trim() || null,
                    notes: notes.trim() || null,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to update expense");
            }

            onExpenseUpdated();
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expense?.id) return;
        
        setDeleting(true);
        setError("");

        try {
            const response = await fetch("/api/financials/one-time", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: expense.id }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Failed to delete expense");
            }

            setShowDeleteConfirm(false);
            setIsOpen(false);
            onExpenseDeleted?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Edit Expense</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update the details of this expense.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {/* Expense Name */}
                    <div>
                        <Label htmlFor="expenseName" className="text-foreground">
                            Expense Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="expenseName"
                            value={expenseName}
                            onChange={(e) => setExpenseName(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Vendor */}
                    <div>
                        <Label htmlFor="vendor" className="text-foreground">
                            Vendor
                        </Label>
                        <Input
                            id="vendor"
                            placeholder="e.g., AutoZone, O'Reilly, NAPA"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Amount and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="amount" className="text-foreground">
                                Amount ($) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="category" className="text-foreground">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="hover:bg-muted">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date and Payment Method */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="expenseDate" className="text-foreground">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="expenseDate"
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                            />
                        </div>
                        <div>
                            <Label htmlFor="paymentMethod" className="text-foreground">
                                Payment Method
                            </Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    {PAYMENT_METHODS.map((method) => (
                                        <SelectItem key={method.value} value={method.value} className="hover:bg-muted">
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes" className="text-foreground">
                            Notes / Comments
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional details about this expense..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground min-h-[80px]"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading || deleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsOpen(false)} 
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || deleting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-popover border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete "{expenseName}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            disabled={deleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
