"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import SupplierDropdownSelector from "@/app/(features)/suppliers/components/supplier-dropdown-selector";
import { useSuppliers } from "@/app/(features)/suppliers/hooks/use-suppliers";

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

const HST_RATE = 0.13; // 13% HST

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

    const { suppliers } = useSuppliers();

    // Form state
    const [expenseName, setExpenseName] = useState("");
    const [subtotal, setSubtotal] = useState("");
    const [includeTax, setIncludeTax] = useState(true);
    const [taxAmount, setTaxAmount] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [category, setCategory] = useState("");
    const [expenseDate, setExpenseDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("credit_card");
    const [supplierId, setSupplierId] = useState("");
    const [customVendor, setCustomVendor] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [partsDescription, setPartsDescription] = useState("");
    const [warranty, setWarranty] = useState("");
    const [notes, setNotes] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState("");

    // Track which field was last edited to determine calculation direction
    const [lastEditedField, setLastEditedField] = useState<'subtotal' | 'total'>('subtotal');

    // Calculate based on which field was last edited
    useEffect(() => {
        if (lastEditedField === 'subtotal') {
            // Calculate total from subtotal
            const sub = parseFloat(subtotal) || 0;
            if (includeTax && sub > 0) {
                const tax = sub * HST_RATE;
                const total = sub + tax;
                setTaxAmount(tax.toFixed(2));
                setTotalAmount(total.toFixed(2));
            } else {
                setTaxAmount("0.00");
                setTotalAmount(sub.toFixed(2));
            }
        }
    }, [subtotal, includeTax, lastEditedField]);

    // Handle total amount change - reverse calculate subtotal
    const handleTotalChange = (value: string) => {
        setLastEditedField('total');
        setTotalAmount(value);
        
        const total = parseFloat(value) || 0;
        if (includeTax && total > 0) {
            const sub = total / (1 + HST_RATE);
            const tax = sub * HST_RATE; // Always calculate HST as exactly 13% of subtotal
            setSubtotal(sub.toFixed(2));
            setTaxAmount(tax.toFixed(2));
        } else {
            setSubtotal(value);
            setTaxAmount("0.00");
        }
    };

    // Handle subtotal change
    const handleSubtotalChange = (value: string) => {
        setLastEditedField('subtotal');
        setSubtotal(value);
    };

    // Load expense data when modal opens or expense changes
    useEffect(() => {
        if (expense && isOpen) {
            setExpenseName(expense.cost_name || "");
            
            // Handle amount/subtotal - if subtotal exists use it, otherwise derive from amount
            const storedSubtotal = expense.subtotal;
            const storedTaxAmount = expense.tax_amount;
            const storedTaxIncluded = expense.tax_included;
            
            if (storedSubtotal !== undefined && storedSubtotal !== null) {
                setSubtotal(String(storedSubtotal));
                setIncludeTax(storedTaxIncluded ?? true);
            } else {
                // Legacy data - amount is total, reverse calculate subtotal
                const total = parseFloat(expense.amount) || 0;
                if (storedTaxIncluded !== false && total > 0) {
                    const sub = total / (1 + HST_RATE);
                    setSubtotal(sub.toFixed(2));
                    setIncludeTax(true);
                } else {
                    setSubtotal(String(total));
                    setIncludeTax(false);
                }
            }
            
            setCategory(expense.category || "Other");
            setExpenseDate(expense.cost_date ? new Date(expense.cost_date).toISOString().split("T")[0] : "");
            setPaymentMethod(expense.payment_method || "credit_card");
            
            // Determine if vendor is from supplier list or custom
            const vendorName = expense.vendor || "";
            const matchingSupplier = suppliers.find(s => s.name === vendorName);
            if (matchingSupplier) {
                setSupplierId(matchingSupplier.id);
                setCustomVendor("");
            } else if (vendorName) {
                setSupplierId("custom");
                setCustomVendor(vendorName);
            } else {
                setSupplierId("");
                setCustomVendor("");
            }
            
            setInvoiceNumber(expense.invoice_number || "");
            setPartsDescription(expense.parts_description || "");
            setWarranty(expense.warranty || "");
            setNotes(expense.notes || "");
        }
    }, [expense, isOpen, suppliers]);

    const handleSubmit = async () => {
        setError("");
        if (!expenseName || !subtotal || !category || !expenseDate) {
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
                    amount: parseFloat(totalAmount),
                    subtotal: parseFloat(subtotal),
                    tax_amount: parseFloat(taxAmount) || 0,
                    tax_included: includeTax,
                    category,
                    cost_date: expenseDate,
                    payment_method: paymentMethod,
                    vendor: supplierId === 'custom' 
                        ? customVendor.trim() || null 
                        : suppliers.find(s => s.id === supplierId)?.name || null,
                    supplier_id: supplierId !== 'custom' ? supplierId || null : null,
                    invoice_number: invoiceNumber.trim() || null,
                    parts_description: partsDescription.trim() || null,
                    warranty: warranty.trim() || null,
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
                    {/* Vendor/Supplier Selection */}
                    <div className="space-y-3">
                        <div>
                            <Label className="text-foreground">
                                1. Vendor / Supplier
                            </Label>
                            <SupplierDropdownSelector
                                value={supplierId}
                                onValueChange={setSupplierId}
                                placeholder="Select a supplier..."
                                showCustomOption={true}
                                customOptionValue="custom"
                                customOptionLabel="Enter Custom Vendor"
                                className="bg-white dark:bg-background border-border text-foreground"
                            />
                        </div>
                        
                        {/* Custom vendor input when "custom" is selected */}
                        {supplierId === 'custom' && (
                            <div>
                                <Label htmlFor="customVendor" className="text-foreground">
                                    Custom Vendor Name
                                </Label>
                                <Input
                                    id="customVendor"
                                    placeholder="e.g., AutoZone, O'Reilly, NAPA"
                                    value={customVendor}
                                    onChange={(e) => setCustomVendor(e.target.value)}
                                    className="bg-white dark:bg-background border-border text-foreground"
                                />
                            </div>
                        )}
                        
                        <div>
                            <Label htmlFor="invoiceNumber" className="text-foreground">
                                2. Invoice #
                            </Label>
                            <Input
                                id="invoiceNumber"
                                placeholder="Vendor invoice number"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="bg-white dark:bg-background border-border text-foreground"
                            />
                        </div>
                    </div>

                    {/* Expense Name */}
                    <div>
                        <Label htmlFor="expenseName" className="text-foreground">
                            Expense Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="expenseName"
                            placeholder="e.g., Oil Filters - Bulk Order"
                            value={expenseName}
                            onChange={(e) => setExpenseName(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Amount Section with Tax */}
                    <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">3. Amount & Tax</h4>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="includeTax" className="text-sm text-muted-foreground">
                                    4. Include HST (13%)
                                </Label>
                                <Switch
                                    id="includeTax"
                                    checked={includeTax}
                                    onCheckedChange={setIncludeTax}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="subtotal" className="text-muted-foreground text-xs">
                                    Subtotal <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="subtotal"
                                    type="number"
                                    placeholder="0.00"
                                    value={subtotal}
                                    onChange={(e) => handleSubtotalChange(e.target.value)}
                                    className="bg-white dark:bg-background border-border text-foreground"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label htmlFor="taxAmount" className="text-muted-foreground text-xs">
                                    HST (13%)
                                </Label>
                                <Input
                                    id="taxAmount"
                                    type="number"
                                    placeholder="0.00"
                                    value={taxAmount}
                                    readOnly
                                    className="bg-muted/50 dark:bg-muted/20 border-border text-foreground cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <Label htmlFor="totalAmount" className="text-muted-foreground text-xs">
                                    Total <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="totalAmount"
                                    type="number"
                                    placeholder="0.00"
                                    value={totalAmount}
                                    onChange={(e) => handleTotalChange(e.target.value)}
                                    className="bg-white dark:bg-background border-border text-foreground font-semibold"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category and Date */}
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    {/* Warranty */}
                    <div>
                        <Label htmlFor="warranty" className="text-foreground">
                            5. Warranty
                        </Label>
                        <Input
                            id="warranty"
                            placeholder="e.g., 1 year, Lifetime, 90 days"
                            value={warranty}
                            onChange={(e) => setWarranty(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Parts Description */}
                    <div>
                        <Label htmlFor="partsDescription" className="text-foreground">
                            6. Parts Description
                        </Label>
                        <Textarea
                            id="partsDescription"
                            placeholder="List of parts included in this expense..."
                            value={partsDescription}
                            onChange={(e) => setPartsDescription(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground min-h-[60px]"
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <Label htmlFor="paymentMethod" className="text-foreground">
                            7. Payment Method
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
                            className="bg-white dark:bg-background border-border text-foreground min-h-[60px]"
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
