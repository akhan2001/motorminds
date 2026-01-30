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
import { useCreateExpense } from "../hooks/use-expenses";
import { 
    EXPENSE_CATEGORIES, 
    EXPENSE_PAYMENT_METHODS, 
    HST_RATE,
    calculateTaxFromSubtotal,
    calculateSubtotalFromTotal,
} from "../lib/validations/expense-schema";
import type { CreateExpenseRequest } from "../types/expenses";
import { getTorontoDateString } from "@/lib/utils/date";

interface AddExpenseModalProps {
    shopId: string;
    onExpenseAdded?: () => void;
    children: React.ReactNode;
    /** Optional callback for work order context - receives expense data when saved */
    onWorkOrderExpenseCreated?: (expenseData: {
        description: string;
        total: number;
        subtotal: number;
        tax_amount?: number;
        tax_included?: boolean;
        payment_method?: string;
        category: string;
        vendor: string | null;
        invoice_number: string | null;
        parts_description: string | null;
        warranty_period: string | null;
        notes: string | null;
        expense_date?: string;
    }) => void;
    /** Optional work order ID to link expense */
    workOrderId?: string | null;
    /** Optional invoice ID to link expense */
    invoiceId?: string | null;
    /** Optional controlled open state */
    open?: boolean;
    /** Optional controlled onOpenChange handler */
    onOpenChange?: (open: boolean) => void;
}

export default function AddExpenseModal({
    shopId,
    onExpenseAdded,
    children,
    onWorkOrderExpenseCreated,
    workOrderId,
    invoiceId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: AddExpenseModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    
    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = controlledOnOpenChange || setInternalOpen;
    
    // Form state
    const [description, setDescription] = useState("");
    const [subtotal, setSubtotal] = useState(""); // Pre-tax amount
    const [includeTax, setIncludeTax] = useState(true); // Default tax included
    const [taxAmount, setTaxAmount] = useState(""); // Auto-calculated tax
    const [totalAmount, setTotalAmount] = useState(""); // Total with tax
    const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
    const [expenseDate, setExpenseDate] = useState(getTorontoDateString());
    const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
    const [supplierId, setSupplierId] = useState(""); // Selected supplier ID
    const [customVendor, setCustomVendor] = useState(""); // Custom vendor name if not from list
    const [invoiceNumber, setInvoiceNumber] = useState(""); // Invoice # from vendor
    const [partsDescription, setPartsDescription] = useState(""); // Parts description
    const [warrantyPeriod, setWarrantyPeriod] = useState(""); // Warranty info
    const [notes, setNotes] = useState("");
    const [isBillable, setIsBillable] = useState(false);
    const [error, setError] = useState("");

    // Track which field was last edited to determine calculation direction
    const [lastEditedField, setLastEditedField] = useState<'subtotal' | 'total'>('subtotal');

    // Hooks
    const { suppliers } = useSuppliers();
    const createExpense = useCreateExpense();

    // Calculate based on which field was last edited
    useEffect(() => {
        if (lastEditedField === 'subtotal') {
            const sub = parseFloat(subtotal) || 0;
            const { taxAmount: tax, total } = calculateTaxFromSubtotal(sub, includeTax, HST_RATE);
            setTaxAmount(tax.toFixed(2));
            setTotalAmount(total.toFixed(2));
        }
    }, [subtotal, includeTax, lastEditedField]);

    // Handle total amount change - reverse calculate subtotal
    const handleTotalChange = (value: string) => {
        setLastEditedField('total');
        setTotalAmount(value);
        
        const total = parseFloat(value) || 0;
        const { subtotal: sub, taxAmount: tax } = calculateSubtotalFromTotal(total, includeTax, HST_RATE);
        setSubtotal(sub.toFixed(2));
        setTaxAmount(tax.toFixed(2));
    };

    // Handle subtotal change
    const handleSubtotalChange = (value: string) => {
        setLastEditedField('subtotal');
        setSubtotal(value);
    };

    // Get vendor name based on selection
    const getVendorName = (): string | null => {
        if (supplierId === 'custom') {
            return customVendor.trim() || null;
        }
        return suppliers.find(s => s.id === supplierId)?.name || null;
    };

    // Determine source type based on context
    const getSourceType = (): 'work_order' | 'invoice' | 'general' => {
        if (workOrderId) return 'work_order';
        if (invoiceId) return 'invoice';
        return 'general';
    };

    const resetForm = () => {
        setDescription("");
        setSubtotal("");
        setTaxAmount("");
        setTotalAmount("");
        setIncludeTax(true);
        setLastEditedField('subtotal');
        setCategory(EXPENSE_CATEGORIES[0]);
        setExpenseDate(getTorontoDateString());
        setPaymentMethod("credit_card");
        setSupplierId("");
        setCustomVendor("");
        setInvoiceNumber("");
        setPartsDescription("");
        setWarrantyPeriod("");
        setNotes("");
        setIsBillable(false);
        setError("");
    };

    const handleSubmit = async () => {
        setError("");
        
        // Validation
        if (!description.trim()) {
            setError("Description is required.");
            return;
        }
        if (!subtotal || parseFloat(subtotal) <= 0) {
            setError("Please enter a valid subtotal amount.");
            return;
        }
        if (!category) {
            setError("Please select a category.");
            return;
        }
        if (!expenseDate) {
            setError("Please select a date.");
            return;
        }

        const expenseData: CreateExpenseRequest = {
            shop_id: shopId,
            work_order_id: workOrderId || null,
            invoice_id: invoiceId || null,
            source_type: getSourceType(),
            description: description.trim(),
            category,
            subtotal: parseFloat(subtotal),
            tax_amount: parseFloat(taxAmount) || 0,
            tax_rate: HST_RATE,
            tax_included: includeTax,
            total: parseFloat(totalAmount),
            vendor: getVendorName(),
            invoice_number: invoiceNumber.trim() || null,
            payment_method: paymentMethod || null,
            parts_description: partsDescription.trim() || null,
            expense_date: expenseDate,
            warranty_period: warrantyPeriod.trim() || null,
            notes: notes.trim() || null,
            is_billable: isBillable,
        };

        try {
            await createExpense.mutateAsync(expenseData);
            
            // Call work order callback if provided (for adding to work order items)
            if (onWorkOrderExpenseCreated) {
                onWorkOrderExpenseCreated({
                    description: expenseData.description,
                    total: expenseData.total,
                    subtotal: expenseData.subtotal,
                    tax_amount: expenseData.tax_amount || undefined,
                    tax_included: expenseData.tax_included || undefined,
                    payment_method: expenseData.payment_method || undefined,
                    category: expenseData.category,
                    vendor: expenseData.vendor || null,
                    invoice_number: expenseData.invoice_number || null,
                    parts_description: expenseData.parts_description || null,
                    warranty_period: expenseData.warranty_period || null,
                    notes: expenseData.notes || null,
                    expense_date: expenseData.expense_date,
                });
            }

            // Reset form and close
            resetForm();
            onExpenseAdded?.();
            setIsOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to create expense");
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setError("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="bg-slate-50 dark:bg-card border-border text-foreground max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Add New General Expense</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Record a new general expense for your shop.
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

                    {/* Expense Description */}
                    <div>
                        <Label htmlFor="description" className="text-foreground">
                            Description <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="description"
                            placeholder="e.g., Oil Filters - Bulk Order"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Amount Section with Tax */}
                    <div className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">3. Amount & Tax</h4>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="includeTax" className="text-sm text-muted-foreground">
                                    Include HST (13%)
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
                        <Label htmlFor="warrantyPeriod" className="text-foreground">
                            4. Warranty
                        </Label>
                        <Input
                            id="warrantyPeriod"
                            placeholder="e.g., 1 year, Lifetime, 90 days"
                            value={warrantyPeriod}
                            onChange={(e) => setWarrantyPeriod(e.target.value)}
                            className="bg-white dark:bg-background border-border text-foreground"
                        />
                    </div>

                    {/* Parts Description */}
                    <div>
                        <Label htmlFor="partsDescription" className="text-foreground">
                            5. Parts Description
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
                            6. Payment Method
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground border-border">
                                {EXPENSE_PAYMENT_METHODS.map((method) => (
                                    <SelectItem key={method.value} value={method.value} className="hover:bg-muted">
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Billable toggle */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isBillable" className="text-foreground">
                            Billable to Customer
                        </Label>
                        <Switch
                            id="isBillable"
                            checked={isBillable}
                            onCheckedChange={setIsBillable}
                        />
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
                        disabled={createExpense.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {createExpense.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
