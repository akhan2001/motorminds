"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../types/work-order-item-templates";
import { useAuth } from "../../../hooks/use-auth";
import { useSuppliers } from "@/app/(features)/suppliers/hooks/use-suppliers";

interface PartFormItem {
    id: string;
    description: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit_cost?: number;
    total_cost?: number;
    supplier?: string;
    category?: string;
    warranty_period?: string;
    notes?: string;
}

interface WorkOrderPartsItemsProps {
    items: PartFormItem[];
    onItemsChange: (items: PartFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
    onItemDeleted?: (itemId: string) => void; // Callback when item is deleted from database
    isEditing?: boolean; // Whether the work order is in edit mode
}

export function WorkOrderPartsItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    onItemSaved,
    onItemDeleted,
    isEditing = true
}: WorkOrderPartsItemsProps) {

    const { shopId } = useAuth();
    const { suppliers, loading: suppliersLoading } = useSuppliers();
    
    // Filter only active suppliers
    const activeSuppliers = suppliers.filter(supplier => supplier.status === 'active');

    // Helper function to convert form item to service format
    // Ensures ALL fields are included when saving
    const convertToWorkOrderItem = (item: PartFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: 'part' as const,
        description: item.description,
        part_number: item.part_number || undefined,
        quantity: item.quantity ?? 1, // Default to 1 if not set (matches DB default)
        unit_price: item.unit_price ?? 0, // Default to 0 if not set (matches DB default, use ?? to preserve 0)
        unit_cost: item.unit_cost !== undefined && item.unit_cost !== null ? item.unit_cost : undefined, // Preserve 0 values
        supplier: item.supplier || undefined,
        category: item.category || undefined,
        warranty_period: item.warranty_period || undefined,
        notes: item.notes || undefined,
    });

    // Function to save item to database
    const saveItemToDatabase = async (item: PartFormItem) => {
        if (!workOrderId) {
            toast.error('Work Order ID is required to save items');
            return;
        }

        // Only description is required for part items
        if (!item.description.trim()) {
            toast.error('Description is required');
            return;
        }

        try {
            const itemData = convertToWorkOrderItem(item);
            const savedItem = await WorkOrderItemsService.createWorkOrderItem(itemData);
            onItemSaved?.(savedItem);
            toast.success('Part item saved successfully');
        } catch (error: any) {
            console.error('Error saving part item:', error);
            toast.error(error.message || 'Failed to save part item');
        }
    };
    
    const addItem = () => {
        if (items.length >= 20) {
            toast.error(`Maximum 20 part items allowed`);
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
                toast.success('Part item deleted');
                
                // Notify parent component for optimistic updates
                onItemDeleted?.(id);
            } catch (error: any) {
                // If item doesn't exist in database, that's fine - it was only local
                if (error.message?.includes('not found')) {
                    console.log('Item was only local, no database deletion needed');
                } else {
                    console.error('Error deleting part item:', error);
                    toast.error('Failed to delete item from database');
                    // Revert local state on error
                    onItemsChange(items);
                }
            }
        }
    };

    const updateItem = (id: string, field: keyof PartFormItem, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id !== id) return item;
            
            let updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields
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
                            (updatedItem as any)[field] = parsed;
                        }
                    }
                } else {
                    (updatedItem as any)[field] = value;
                }
            } else {
                (updatedItem as any)[field] = value;
            }
            
            // Calculate total price when quantity or unit price changes
            if (field === 'quantity' || field === 'unit_price') {
                updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
            }
            
            // Calculate total cost when quantity or unit cost changes
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-foreground">Parts Items</h3>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-slate-50 dark:bg-card">
                    No parts items added yet. Click "Add Part" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-card border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Part Item {index + 1}</h4>
                                </div>
                                {isEditing && (
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
                                )}
                            </div>

                            <div className="space-y-3">
                                {/* Description and Part Number */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`part_description_${index}`} className="text-muted-foreground text-xs">
                                            Description *
                                        </Label>
                                        <TemplateDropdown
                                            shopId={shopId || ''}
                                            itemType="part"
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
                                                        
                                                        toast.success('Part item created from template');
                                                    } catch (error: any) {
                                                        console.error('Error saving part item from template:', error);
                                                        toast.error('Failed to save part item');
                                                        // Revert to original state on error
                                                        onItemsChange(items);
                                                    }
                                                }
                                            }}
                                            placeholder="Type here to search for a part item template..."
                                            disabled={!isEditing}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_number_${index}`} className="text-muted-foreground text-xs">
                                            Part Number
                                        </Label>
                                        <Input
                                            id={`part_number_${index}`}
                                            value={item.part_number || ''}
                                            onChange={(e) => updateItem(item.id, 'part_number', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            placeholder="P/N"
                                        />
                                    </div>
                                </div>

                                {/* Quantity, Unit Cost, Unit Price, Total Price */}
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <Label htmlFor={`part_quantity_${index}`} className="text-muted-foreground text-xs">
                                            Quantity
                                        </Label>
                                        <Input
                                            id={`part_quantity_${index}`}
                                            type="number"
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            min="1"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_unit_cost_${index}`} className="text-muted-foreground text-xs">
                                            Unit Cost
                                        </Label>
                                        <Input
                                            id={`part_unit_cost_${index}`}
                                            type="number"
                                            value={item.unit_cost || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_cost', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_unit_price_${index}`} className="text-muted-foreground text-xs">
                                            Unit Price
                                        </Label>
                                        <Input
                                            id={`part_unit_price_${index}`}
                                            type="number"
                                            value={item.unit_price || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_total_${index}`} className="text-muted-foreground text-xs">
                                            Total Price
                                        </Label>
                                        <Input
                                            id={`part_total_${index}`}
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
                                        <Label htmlFor={`part_supplier_${index}`} className="text-muted-foreground text-xs">
                                            Supplier
                                        </Label>
                                        {suppliersLoading ? (
                                            <Input
                                                id={`part_supplier_${index}`}
                                                value={item.supplier || ''}
                                                disabled
                                                className="bg-white dark:bg-background border-border text-foreground"
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
                                                        id={`part_supplier_custom_${index}`}
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
                                                id={`part_supplier_${index}`}
                                                value={item.supplier || ''}
                                                onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                                                className="bg-white dark:bg-background border-border text-foreground"
                                                disabled={!isEditing}
                                                placeholder="Supplier name"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_category_${index}`} className="text-muted-foreground text-xs">
                                            Category
                                        </Label>
                                        <Input
                                            id={`part_category_${index}`}
                                            value={item.category || ''}
                                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            placeholder="Category"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_warranty_${index}`} className="text-muted-foreground text-xs">
                                            Warranty
                                        </Label>
                                        <Input
                                            id={`part_warranty_${index}`}
                                            value={item.warranty_period || ''}
                                            onChange={(e) => updateItem(item.id, 'warranty_period', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            placeholder="12 months"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes !== undefined && (
                                    <div>
                                        <Label htmlFor={`part_notes_${index}`} className="text-muted-foreground text-xs">
                                            Notes (Optional)
                                        </Label>
                                        <Textarea
                                            id={`part_notes_${index}`}
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

            {/* Add Part Button at Bottom - Only show when editing */}
            {isEditing && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Part
                    </Button>
                </div>
            )}
        </div>
    );
}