"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuppliers } from "@/app/(features)/suppliers/hooks/use-suppliers";
import AddExpenseModal from "@/app/financials/efficiency/components/AddExpenseModal";

import { Plus, Trash2, Receipt, ArrowUpRight } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../../lib/work-order-items-service";
import { WorkOrderItemCreateSchema } from "../../../../lib/validations/work-order-items";
import { TemplateDropdown } from "../../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../../types/work-order-item-templates";
import { useAuth } from "../../../../hooks/use-auth";
import type { ExpenseFormItem } from "../../../../types/work-order-item-forms";

interface WorkOrderExpenseItemsProps {
    items: ExpenseFormItem[];
    onItemsChange: (items: ExpenseFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
    onItemDeleted?: (itemId: string) => void; // Callback when item is deleted from database
    isEditing?: boolean; // Whether the work order is in edit mode
}

export function WorkOrderExpenseItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    onItemSaved,
    onItemDeleted,
    isEditing = true
}: WorkOrderExpenseItemsProps) {

    const { shopId } = useAuth();
    const { suppliers, loading: suppliersLoading } = useSuppliers();
    
    // Filter only active suppliers
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'active');

    // Track which item's modal is open
    const [expandingItemId, setExpandingItemId] = useState<string | null>(null);

    // Helper function to validate and sanitize expense item data
    const validateExpenseItem = (item: ExpenseFormItem): { valid: boolean; errors: string[]; sanitized?: ExpenseFormItem } => {
        const errors: string[] = [];

        // Validate description (required, 1-500 chars)
        const description = item.description.trim();
        if (!description) {
            errors.push('Description is required');
        } else if (description.length > 500) {
            errors.push('Description must be 500 characters or less');
        }

        // Validate part_number (optional, max 100 chars)
        if (item.part_number && item.part_number.length > 100) {
            errors.push('Part number must be 100 characters or less');
        }

        // Validate quantity (must be positive)
        if (item.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        // Validate unit_price (must be nonnegative)
        if (item.unit_price < 0) {
            errors.push('Unit price cannot be negative');
        }

        // Validate unit_cost (optional, must be nonnegative if provided)
        if (item.unit_cost !== undefined && item.unit_cost !== null && item.unit_cost < 0) {
            errors.push('Unit cost cannot be negative');
        }

        // Validate supplier (optional, max 200 chars)
        if (item.supplier && item.supplier.length > 200) {
            errors.push('Supplier must be 200 characters or less');
        }

        // Validate category (optional, max 100 chars)
        if (item.category && item.category.length > 100) {
            errors.push('Category must be 100 characters or less');
        }

        // Validate warranty_period (optional, max 50 chars)
        if (item.warranty_period && item.warranty_period.length > 50) {
            errors.push('Warranty period must be 50 characters or less');
        }

        // Validate notes (optional, max 1000 chars)
        if (item.notes && item.notes.length > 1000) {
            errors.push('Notes must be 1000 characters or less');
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        // Return sanitized item with trimmed strings and proper defaults
        const sanitized: ExpenseFormItem = {
            ...item,
            description: description,
            part_number: item.part_number?.trim() || undefined,
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price ?? 0,
            unit_cost: item.unit_cost !== undefined && item.unit_cost !== null ? item.unit_cost : undefined,
            supplier: item.supplier?.trim() || undefined,
            category: item.category?.trim() || undefined,
            warranty_period: item.warranty_period?.trim() || undefined,
            notes: item.notes?.trim() || undefined,
        };

        return { valid: true, errors: [], sanitized };
    };

    // Helper function to convert form item to service format
    // Ensures ALL fields are included when saving and validated
    const convertToWorkOrderItem = (item: ExpenseFormItem): WorkOrderItemCreateData => {
        // Validate and sanitize first
        const validation = validateExpenseItem(item);
        if (!validation.valid || !validation.sanitized) {
            throw new Error(validation.errors.join(', '));
        }

        const sanitized = validation.sanitized;

        // Convert to WorkOrderItemCreateData format
        const itemData: WorkOrderItemCreateData = {
            work_order_id: workOrderId!,
            item_type: 'expense' as const,
            description: sanitized.description,
            part_number: sanitized.part_number || undefined,
            quantity: sanitized.quantity,
            unit_price: sanitized.unit_price,
            unit_cost: sanitized.unit_cost !== undefined && sanitized.unit_cost !== null ? sanitized.unit_cost : undefined,
            supplier: sanitized.supplier || undefined,
            category: sanitized.category || undefined,
            warranty_period: sanitized.warranty_period || undefined,
            notes: sanitized.notes || undefined,
        };

        // Final validation using Zod schema
        try {
            return WorkOrderItemCreateSchema.parse(itemData);
        } catch (validationError: any) {
            const errorMessages = validationError.errors?.map((err: any) => 
                `${err.path.join('.')}: ${err.message}`
            ).join(', ') || validationError.message || 'Validation failed';
            throw new Error(`Invalid expense item data: ${errorMessages}`);
        }
    };

    // Function to save item to database
    const saveItemToDatabase = async (item: ExpenseFormItem) => {
        if (!workOrderId) {
            toast.error('Work Order ID is required to save items');
            return;
        }

        // Validate item before attempting to save
        const validation = validateExpenseItem(item);
        if (!validation.valid) {
            toast.error(validation.errors.join(', '));
            return;
        }

        try {
            const itemData = convertToWorkOrderItem(item);
            const savedItem = await WorkOrderItemsService.createWorkOrderItem(itemData);
            onItemSaved?.(savedItem);
            toast.success('Expense item saved successfully');
        } catch (error: any) {
            console.error('Error saving expense item:', error);
            toast.error(error.message || 'Failed to save expense item');
        }
    };
    
    const addItem = () => {
        if (items.length >= 20) {
            toast.error(`Maximum 20 expense items allowed`);
            return;
        }
        onItemsChange([...items, { 
            id: uuidv4(), 
            description: "", 
            part_number: "",
            quantity: 1, 
            unit_price: 0,
            total_price: 0,
            unit_cost: 0,
            total_cost: 0,
            supplier: "",
            category: "",
            warranty_period: "",
            notes: ""
        }]);
    };

    const removeItem = async (id: string) => {
        // Update local state immediately for better UX
        const updatedItems = items.filter(item => item.id !== id);
        onItemsChange(updatedItems);

        // If workOrderId exists, try to delete from database
        if (workOrderId) {
            try {
                // Check if item exists in database first
                await WorkOrderItemsService.getWorkOrderItem(id);
                // Item exists, delete it
                await WorkOrderItemsService.deleteWorkOrderItem(id);
                toast.success('Expense item deleted');
                
                // Notify parent component for optimistic updates
                onItemDeleted?.(id);
            } catch (error: any) {
                // If item doesn't exist in database, that's fine - it was only local
                if (error.message?.includes('not found')) {
                    console.log('Item was only local, no database deletion needed');
                } else {
                    console.error('Error deleting expense item:', error);
                    toast.error('Failed to delete item from database');
                    // Revert local state on error
                    onItemsChange(items);
                }
            }
        }
    };

    const updateItem = (id: string, field: keyof ExpenseFormItem, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id !== id) return item;
            
            let updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields with validation
            if (field === 'quantity' || field === 'unit_price' || field === 'unit_cost') {
                if (typeof value === 'string') {
                    // Handle empty string as undefined for optional fields
                    if (value.trim() === '') {
                        if (field === 'quantity') {
                            updatedItem.quantity = 1;
                        } else if (field === 'unit_cost') {
                            updatedItem.unit_cost = undefined;
                        } else {
                            updatedItem.unit_price = 0;
                        }
                    } else {
                        const parsed = parseFloat(value);
                        if (isNaN(parsed)) {
                            if (field === 'quantity') {
                                updatedItem.quantity = 1;
                            } else if (field === 'unit_cost') {
                                updatedItem.unit_cost = undefined;
                            } else {
                                updatedItem.unit_price = 0;
                            }
                        } else {
                            // Validate numeric constraints
                            if (field === 'quantity' && parsed <= 0) {
                                // Quantity must be positive
                                updatedItem.quantity = 1;
                                toast.error('Quantity must be greater than 0');
                            } else if ((field === 'unit_price' || field === 'unit_cost') && parsed < 0) {
                                // Prices must be nonnegative
                                (updatedItem as any)[field] = 0;
                                toast.error(`${field === 'unit_price' ? 'Unit price' : 'Unit cost'} cannot be negative`);
                            } else {
                                (updatedItem as any)[field] = parsed;
                            }
                        }
                    }
                } else {
                    // Validate numeric constraints for direct number values
                    if (field === 'quantity' && value <= 0) {
                        updatedItem.quantity = 1;
                        toast.error('Quantity must be greater than 0');
                    } else if ((field === 'unit_price' || field === 'unit_cost') && value < 0) {
                        (updatedItem as any)[field] = 0;
                        toast.error(`${field === 'unit_price' ? 'Unit price' : 'Unit cost'} cannot be negative`);
                    } else {
                        (updatedItem as any)[field] = value;
                    }
                }
            } else if (typeof value === 'string') {
                // Validate string field lengths according to schema
                const stringValue = value;
                let finalValue = stringValue;

                if (field === 'description') {
                    // Description: max 500 chars (required, but we allow empty during editing)
                    if (stringValue.length > 500) {
                        finalValue = stringValue.substring(0, 500);
                        toast.error('Description limited to 500 characters');
                    }
                } else if (field === 'part_number') {
                    // Part number: max 100 chars
                    if (stringValue.length > 100) {
                        finalValue = stringValue.substring(0, 100);
                        toast.error('Part number limited to 100 characters');
                    }
                } else if (field === 'supplier') {
                    // Supplier: max 200 chars
                    if (stringValue.length > 200) {
                        finalValue = stringValue.substring(0, 200);
                        toast.error('Supplier limited to 200 characters');
                    }
                } else if (field === 'category') {
                    // Category: max 100 chars
                    if (stringValue.length > 100) {
                        finalValue = stringValue.substring(0, 100);
                        toast.error('Category limited to 100 characters');
                    }
                } else if (field === 'warranty_period') {
                    // Warranty period: max 50 chars
                    if (stringValue.length > 50) {
                        finalValue = stringValue.substring(0, 50);
                        toast.error('Warranty period limited to 50 characters');
                    }
                } else if (field === 'notes') {
                    // Notes: max 1000 chars
                    if (stringValue.length > 1000) {
                        finalValue = stringValue.substring(0, 1000);
                        toast.error('Notes limited to 1000 characters');
                    }
                }

                (updatedItem as any)[field] = finalValue;
            } else {
                (updatedItem as any)[field] = value;
            }
            
            // Calculate total price when quantity or unit price changes
            // NOTE: This is for UI feedback only. The database trigger will calculate the actual total_price on save.
            if (field === 'quantity' || field === 'unit_price') {
                updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
            }
            
            // Calculate total cost when quantity or unit cost changes
            // NOTE: This is for UI feedback only. The database trigger will calculate the actual total_cost on save.
            if (field === 'quantity' || field === 'unit_cost') {
                // Calculate total_cost if unit_cost is set (including 0)
                if (updatedItem.unit_cost !== undefined && updatedItem.unit_cost !== null) {
                    updatedItem.total_cost = updatedItem.quantity * updatedItem.unit_cost;
                } else {
                    updatedItem.total_cost = undefined;
                }
            }
            
            return updatedItem;
        });
        
        onItemsChange(updatedItems);
    };

    // Handler to convert modal expense data to ExpenseFormItem and update the item
    const handleExpenseFromModal = (expenseData: {
        cost_name: string;
        amount: number;
        subtotal: number;
        category: string;
        vendor: string | null;
        invoice_number: string | null;
        parts_description: string | null;
        warranty: string | null;
        notes: string | null;
    }) => {
        if (!expandingItemId) return;

        // Find the item being expanded
        const item = items.find(i => i.id === expandingItemId);
        if (!item) return;

        // Combine notes from parts_description and notes
        const combinedNotes = [
            expenseData.parts_description,
            expenseData.notes
        ].filter(Boolean).join('\n') || '';

        // Convert modal data to ExpenseFormItem format with validation
        const updatedItem: ExpenseFormItem = {
            ...item,
            description: expenseData.cost_name.trim().substring(0, 500), // Enforce max 500 chars
            unit_price: Math.max(0, expenseData.amount), // Ensure nonnegative
            total_price: Math.max(0, expenseData.amount),
            unit_cost: expenseData.subtotal && expenseData.subtotal > 0 
                ? Math.max(0, expenseData.subtotal) 
                : undefined, // Ensure nonnegative if provided
            total_cost: expenseData.subtotal && expenseData.subtotal > 0 
                ? Math.max(0, expenseData.subtotal) 
                : undefined,
            category: expenseData.category?.trim().substring(0, 100) || undefined, // Enforce max 100 chars
            supplier: expenseData.vendor?.trim().substring(0, 200) || undefined, // Enforce max 200 chars
            warranty_period: expenseData.warranty?.trim().substring(0, 50) || undefined, // Enforce max 50 chars
            part_number: expenseData.invoice_number?.trim().substring(0, 100) || undefined, // Enforce max 100 chars
            notes: combinedNotes.trim().substring(0, 1000) || undefined, // Enforce max 1000 chars
        };

        // Validate the updated item
        const validation = validateExpenseItem(updatedItem);
        if (!validation.valid) {
            toast.error(`Invalid expense data: ${validation.errors.join(', ')}`);
            setExpandingItemId(null);
            return;
        }

        // Use sanitized version if available
        const finalItem = validation.sanitized || updatedItem;

        // Update the item in the list
        const updatedItems = items.map(i => 
            i.id === expandingItemId ? finalItem : i
        );
        onItemsChange(updatedItems);

        // Auto-save to database if workOrderId exists
        if (workOrderId) {
            saveItemToDatabase(finalItem);
        }

        setExpandingItemId(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-foreground">Expense Items</h3>
                <h4 className="text-sm text-muted-foreground dark:text-gray-400">Expenses are excluded from totals (tracking only)</h4>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400 border border-dashed border-border dark:border-[#333333] rounded-lg bg-card dark:bg-[#131313]">
                    No expense items added yet. Click "Add Expense" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className={`border rounded-lg p-4 ${
                            isEditing 
                                ? 'bg-background dark:bg-[#1a1a1a] border-border dark:border-[#333333]' 
                                : 'bg-card dark:bg-[#131313] border-border dark:border-[#333333]'
                        }`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400">Expense Item {index + 1}</h4>
                                </div>
                                {isEditing && (
                                    <div className="flex items-center gap-1">
                                        {/* Expand Button - Opens AddExpenseModal */}
                                        <AddExpenseModal
                                            shopId={shopId || ''}
                                            onExpenseAdded={() => {}} // Empty callback since we use onWorkOrderExpenseCreated
                                            onWorkOrderExpenseCreated={handleExpenseFromModal}
                                            open={expandingItemId === item.id}
                                            onOpenChange={(open) => {
                                                if (!open) {
                                                    setExpandingItemId(null);
                                                } else {
                                                    setExpandingItemId(item.id);
                                                }
                                            }}
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0"
                                                title="Expand to detailed expense form"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandingItemId(item.id);
                                                }}
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </AddExpenseModal>
                                        
                                        {/* Delete Button */}
                                        <Button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {/* Description and Part Number */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`expense_description_${index}`} className="text-muted-foreground text-xs">
                                            Description *
                                        </Label>
                                        <TemplateDropdown
                                            shopId={shopId || ''}
                                            itemType="expense"
                                            value={item.description}
                                            onChange={(value) => updateItem(item.id, 'description', value)}
                                            onTemplateSelect={async (template: WorkOrderItemTemplate) => {
                                                // Create updated item with template data
                                                const updatedItem = {
                                                    ...item,
                                                    description: template.name,
                                                    part_number: template.part_number || item.part_number,
                                                    quantity: template.quantity,
                                                    unit_price: template.unit_price,
                                                    total_price: template.quantity * template.unit_price,
                                                    unit_cost: template.unit_cost || item.unit_cost,
                                                    total_cost: template.unit_cost ? template.quantity * template.unit_cost : item.total_cost,
                                                    supplier: template.supplier || item.supplier,
                                                    category: template.category || item.category,
                                                    warranty_period: template.warranty_period || item.warranty_period,
                                                    notes: template.description || item.notes,
                                                };

                                                // Update local state first for immediate UI feedback
                                                const updatedItems = items.map(i => i.id === item.id ? updatedItem : i);
                                                onItemsChange(updatedItems);

                                                // Auto-save to database if workOrderId exists
                                                if (workOrderId) {
                                                    try {
                                                        const itemData = convertToWorkOrderItem(updatedItem);
                                                        const savedItem = await WorkOrderItemsService.createWorkOrderItem(itemData);
                                                        
                                                        // Update local state with database ID and notify parent
                                                        const finalItems = items.map(i => 
                                                            i.id === item.id ? { ...updatedItem, id: savedItem.id } : i
                                                        );
                                                        onItemsChange(finalItems);
                                                        onItemSaved?.(savedItem);
                                                        
                                                        toast.success('Expense item created from template');
                                                    } catch (error: any) {
                                                        console.error('Error saving expense item from template:', error);
                                                        toast.error('Failed to save expense item');
                                                        // Revert to original state on error
                                                        onItemsChange(items);
                                                    }
                                                }
                                            }}
                                            placeholder="Type here to search for an expense item template..."
                                            disabled={!isEditing}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_part_number_${index}`} className="text-muted-foreground text-xs">
                                            Part Number
                                        </Label>
                                        <Input
                                            id={`expense_part_number_${index}`}
                                            value={item.part_number || ''}
                                            onChange={(e) => updateItem(item.id, 'part_number', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            placeholder="P/N"
                                        />
                                    </div>
                                </div>

                                {/* Quantity, Unit Cost, Unit Price, Total Price */}
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <Label htmlFor={`expense_quantity_${index}`} className="text-muted-foreground text-xs">
                                            Quantity
                                        </Label>
                                        <Input
                                            id={`expense_quantity_${index}`}
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            min="1"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_unit_cost_${index}`} className="text-muted-foreground text-xs">
                                            Unit Cost
                                        </Label>
                                        <Input
                                            id={`expense_unit_cost_${index}`}
                                            type="number"
                                            value={item.unit_cost !== undefined && item.unit_cost !== null ? item.unit_cost : ''}
                                            onChange={(e) => updateItem(item.id, 'unit_cost', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_unit_price_${index}`} className="text-muted-foreground text-xs">
                                            Unit Price
                                        </Label>
                                        <Input
                                            id={`expense_unit_price_${index}`}
                                            type="number"
                                            value={item.unit_price || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_total_${index}`} className="text-muted-foreground text-xs">
                                            Total Price
                                        </Label>
                                        <Input
                                            id={`expense_total_${index}`}
                                            type="number"
                                            value={item.total_price.toFixed(2)}
                                            disabled
                                            className="bg-slate-50 dark:bg-muted border-border text-foreground font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Supplier, Category, Warranty */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor={`expense_supplier_${index}`} className="text-muted-foreground text-xs">
                                            Supplier
                                        </Label>
                                        {suppliersLoading ? (
                                            <Input
                                                id={`expense_supplier_${index}`}
                                                value={item.supplier || ''}
                                                disabled
                                                className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                                placeholder="Loading suppliers..."
                                            />
                                        ) : activeSuppliers.length > 0 ? (
                                            <>
                                                <Select
                                                    value={activeSuppliers.find(s => s.name === item.supplier) ? item.supplier : (item.supplier ? 'custom' : '')}
                                                    onValueChange={(value) => {
                                                        if (value === 'custom') {
                                                            updateItem(item.id, 'supplier', '')
                                                        } else {
                                                            updateItem(item.id, 'supplier', value)
                                                        }
                                                    }}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger className="bg-white dark:bg-background border-border text-foreground">
                                                        <SelectValue placeholder="Select supplier" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {activeSuppliers.map((supplier) => (
                                                            <SelectItem key={supplier.id} value={supplier.name}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{supplier.name}</span>
                                                                    {supplier.contact_person && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {supplier.contact_person}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">
                                                            <span className="text-muted-foreground">Custom / Other</span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(!item.supplier || !activeSuppliers.find(s => s.name === item.supplier)) && (
                                                    <Input
                                                        id={`expense_supplier_custom_${index}`}
                                                        value={item.supplier || ''}
                                                        onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                                                        className="bg-white dark:bg-background border-border text-foreground mt-2"
                                                        disabled={!isEditing}
                                                        placeholder="Enter supplier name"
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <Input
                                                id={`expense_supplier_${index}`}
                                                value={item.supplier || ''}
                                                onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                                                className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                                disabled={!isEditing}
                                                placeholder="Supplier name"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_category_${index}`} className="text-muted-foreground text-xs">
                                            Category
                                        </Label>
                                        <Input
                                            id={`expense_category_${index}`}
                                            value={item.category || ''}
                                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            placeholder="Category"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expense_warranty_${index}`} className="text-muted-foreground text-xs">
                                            Warranty
                                        </Label>
                                        <Input
                                            id={`expense_warranty_${index}`}
                                            value={item.warranty_period || ''}
                                            onChange={(e) => updateItem(item.id, 'warranty_period', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
                                            disabled={!isEditing}
                                            placeholder="12 months"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes !== undefined && (
                                    <div>
                                        <Label htmlFor={`expense_notes_${index}`} className="text-muted-foreground text-xs">
                                            Notes (Optional)
                                        </Label>
                                        <Textarea
                                            id={`expense_notes_${index}`}
                                            value={item.notes || ''}
                                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground min-h-[60px] max-h-[120px]"
                                            disabled={!isEditing}
                                            placeholder="Additional notes..."
                                            rows={2}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Expense Button at Bottom - Only show when editing */}
            {isEditing && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                    </Button>
                </div>
            )}
        </div>
    );
}

