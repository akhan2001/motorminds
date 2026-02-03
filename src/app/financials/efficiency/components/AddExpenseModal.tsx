"use client";

import { useState, useEffect } from "react";
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
import SupplierDropdownSelector from "@/app/(features)/suppliers/components/supplier-dropdown-selector";
import { useSuppliers } from "@/app/(features)/suppliers/hooks/use-suppliers";
import { getTorontoDateString } from "@/lib/utils/date";

interface AddExpenseModalProps {
    shopId: string;
    onExpenseAdded: () => void;
    children: React.ReactNode;
    /** Optional callback for work order context - receives expense data when saved */
    onWorkOrderExpenseCreated?: (expenseData: {
        cost_name: string;
        amount: number;
        subtotal: number;
        tax_amount?: number;
        tax_included?: boolean;
        payment_method?: string;
        category: string;
        vendor: string | null;
        invoice_number: string | null;
        parts_description: string | null;
        warranty: string | null;
        notes: string | null;
        cost_date?: string;
    }) => void;
    /** Optional controlled open state */
    open?: boolean;
    /** Optional controlled onOpenChange handler */
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

export default function AddExpenseModal({
    shopId,
    onExpenseAdded,
    children,
    onWorkOrderExpenseCreated,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: AddExpenseModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    
    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = controlledOnOpenChange || setInternalOpen;
    const [expenseName, setExpenseName] = useState("");
    const [subtotal, setSubtotal] = useState(""); // Pre-tax amount
    const [includeTax, setIncludeTax] = useState(true); // Default tax included
    const [taxAmount, setTaxAmount] = useState(""); // Auto-calculated tax
    const [totalAmount, setTotalAmount] = useState(""); // Total with tax
    const [category, setCategory] = useState("Parts/Inventory");
    const [expenseDate, setExpenseDate] = useState(getTorontoDateString());
    const [paymentMethod, setPaymentMethod] = useState("credit_card"); // Default to credit card
    const [supplierId, setSupplierId] = useState(""); // Selected supplier ID
    const [customVendor, setCustomVendor] = useState(""); // Custom vendor name if not from list
    const [invoiceNumber, setInvoiceNumber] = useState(""); // Invoice # from vendor
    
    const { suppliers } = useSuppliers();
    const [partsDescription, setPartsDescription] = useState(""); // Parts description
    const [warranty, setWarranty] = useState(""); // Warranty info
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async () => {
        setError("");
        if (!expenseName || !subtotal || !category || !expenseDate) {
            setError("Please fill out all required fields.");
            return;
        }
        setLoading(true);

        try {
            const response = await fetch("/api/financials/one-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shop_id: shopId,
                    cost_name: expenseName,
                    amount: parseFloat(totalAmount), // Store total amount
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
                throw new Error(errData.error || "Failed to add expense");
            }

            // Prepare expense data for work order callback
            // Include all fields that mirror one_time_costs schema
            const expenseData = {
                cost_name: expenseName,
                amount: parseFloat(totalAmount),
                subtotal: parseFloat(subtotal),
                tax_amount: parseFloat(taxAmount) || 0,
                tax_included: includeTax,
                payment_method: paymentMethod,
                category,
                vendor: supplierId === 'custom' 
                    ? customVendor.trim() || null 
                    : suppliers.find(s => s.id === supplierId)?.name || null,
                invoice_number: invoiceNumber.trim() || null,
                parts_description: partsDescription.trim() || null,
                warranty: warranty.trim() || null,
                notes: notes.trim() || null,
                cost_date: expenseDate, // Date expense was incurred
            };

            // Call work order callback if provided (before resetting form)
            if (onWorkOrderExpenseCreated) {
                onWorkOrderExpenseCreated(expenseData);
            }

            // Reset form
            setExpenseName("");
            setSubtotal("");
            setTaxAmount("");
            setTotalAmount("");
            setIncludeTax(true);
            setLastEditedField('subtotal');
            setCategory("Parts/Inventory");
            setExpenseDate(getTorontoDateString());
            setPaymentMethod("credit_card");
            setSupplierId("");
            setCustomVendor("");
            setInvoiceNumber("");
            setPartsDescription("");
            setWarranty("");
            setNotes("");
            onExpenseAdded();
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset form on close
            setError("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Add New Expense</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Record a new expense for your shop.
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
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Adding..." : "Add Expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
