"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useSuppliers } from "@/app/(features)/suppliers/hooks/use-suppliers";

import { Plus, Trash2, Package, BookmarkPlus, Save, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../../types/work-order-item-templates";
import { useAuth } from "../../../../hooks/use-auth";
import { useCreateWorkOrderItemTemplate } from "../../../../hooks/use-work-order-item-templates";
import { TEMPLATE_CATEGORIES } from "../../../work-order-items/templates/Categories/template-categories";

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
    const createTemplateMutation = useCreateWorkOrderItemTemplate();
    const [saveTemplateItem, setSaveTemplateItem] = useState<PartFormItem | null>(null);
    const [templateName, setTemplateName] = useState('');

    // Use a ref to track the latest items to avoid stale closure issues
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);
    
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
        const currentItems = itemsRef.current;
        const newId = uuidv4();
        const newItems = [...currentItems, { 
            id: newId, 
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
        }];
        // Update ref IMMEDIATELY before calling onItemsChange
        itemsRef.current = newItems;
        onItemsChange(newItems);
    };

    const removeItem = async (id: string) => {
        // Use ref to get latest items
        const currentItems = itemsRef.current;
        // Update local state immediately for better UX
        const updatedItems = currentItems.filter(item => item.id !== id);
        // Update ref IMMEDIATELY before calling onItemsChange
        itemsRef.current = updatedItems;
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
                    // Revert local state on error - use ref for latest
                    onItemsChange(itemsRef.current);
                }
            }
        }
    };

    const updateItem = (id: string, field: keyof PartFormItem, value: string | number) => {
        // Use ref to get latest items, avoiding stale closure issues
        const currentItems = itemsRef.current;
        const updatedItems = currentItems.map(item => {
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
        
        // Update ref IMMEDIATELY before calling onItemsChange
        itemsRef.current = updatedItems;
        onItemsChange(updatedItems);
    };

    const openSaveTemplateDialog = (item: PartFormItem) => {
        setSaveTemplateItem(item);
        setTemplateName(item.description || '');
    };

    const closeSaveTemplateDialog = () => {
        setSaveTemplateItem(null);
        setTemplateName('');
    };

    const handleSaveAsTemplate = async () => {
        if (!saveTemplateItem || !shopId) return;

        if (!templateName.trim()) {
            toast.error('Template name is required');
            return;
        }
        if (saveTemplateItem.unit_price <= 0) {
            toast.error('Unit price must be greater than 0');
            return;
        }
        if (saveTemplateItem.quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        try {
            await createTemplateMutation.mutateAsync({
                shop_id: shopId,
                item_type: 'part',
                name: templateName.trim(),
                description: saveTemplateItem.notes || undefined,
                quantity: saveTemplateItem.quantity,
                unit_price: saveTemplateItem.unit_price,
                unit_cost: saveTemplateItem.unit_cost ?? undefined,
                category: saveTemplateItem.category || undefined,
                part_number: saveTemplateItem.part_number || undefined,
                supplier: saveTemplateItem.supplier || undefined,
                warranty_period: saveTemplateItem.warranty_period || undefined,
            });
            closeSaveTemplateDialog();
        } catch {
            // Error handled by mutation hook
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-foreground">Parts Items</h3>
            </div>

            {items.length === 0 ? (
                isEditing ? (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        className="group w-full py-8 border border-dashed border-border dark:border-[#333333] rounded-lg bg-transparent hover:bg-transparent hover:border-solid hover:border-green-500/50 dark:hover:border-green-500/50 text-muted-foreground dark:text-gray-400 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                        Add Part
                    </Button>
                ) : (
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-400 border border-dashed border-border dark:border-[#333333] rounded-lg bg-card dark:bg-[#131313]">
                        No parts items added yet.
                    </div>
                )
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
                                    <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Part Item {index + 1}</h4>
                                </div>
                                {isEditing && (
                                    <div className="flex items-center gap-2">
                                        {item.description && item.unit_price > 0 && (
                                            <Button
                                                type="button"
                                                onClick={() => openSaveTemplateDialog(item)}
                                                variant="outline"
                                                size="sm"
                                                className="border-green-300 dark:border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 h-8 px-3"
                                            >
                                                <BookmarkPlus className="h-4 w-4 mr-1" />
                                                Save Template
                                            </Button>
                                        )}
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
                                        <Label htmlFor={`part_description_${index}`} className="text-muted-foreground text-xs">
                                            Description *
                                        </Label>
                                        <TemplateDropdown
                                            shopId={shopId || ''}
                                            itemType="part"
                                            value={item.description}
                                            onChange={(value) => updateItem(item.id, 'description', value)}
                                            onTemplateSelect={async (template: WorkOrderItemTemplate) => {
                                                // Use ref to get latest items to avoid stale closure
                                                const currentItems = itemsRef.current;
                                                const currentItem = currentItems.find(i => i.id === item.id) || item;
                                                // Create updated item with template data
                                                const updatedItem = {
                                                    ...currentItem,
                                                    description: template.name,
                                                    part_number: template.part_number || currentItem.part_number,
                                                    quantity: template.quantity,
                                                    unit_price: template.unit_price,
                                                    total_price: template.quantity * template.unit_price,
                                                    unit_cost: template.unit_cost || currentItem.unit_cost,
                                                    total_cost: template.unit_cost ? template.quantity * template.unit_cost : currentItem.total_cost,
                                                    supplier: template.supplier || currentItem.supplier,
                                                    category: template.category || currentItem.category,
                                                    warranty_period: template.warranty_period || currentItem.warranty_period,
                                                    notes: template.description || currentItem.notes,
                                                };

                                                // Update local state first for immediate UI feedback
                                                const updatedItems = currentItems.map(i => i.id === item.id ? updatedItem : i);
                                                // Update ref IMMEDIATELY before calling onItemsChange
                                                itemsRef.current = updatedItems;
                                                onItemsChange(updatedItems);

                                                // Auto-save to database if workOrderId exists
                                                if (workOrderId) {
                                                    try {
                                                        const itemData = convertToWorkOrderItem(updatedItem);
                                                        const savedItem = await WorkOrderItemsService.createWorkOrderItem(itemData);
                                                        
                                                        // Update local state with database ID and notify parent
                                                        const finalItems = itemsRef.current.map(i => 
                                                            i.id === item.id ? { ...updatedItem, id: savedItem.id } : i
                                                        );
                                                        itemsRef.current = finalItems;
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
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}
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
                                        <Label htmlFor={`part_quantity_${index}`} className="text-muted-foreground text-xs">
                                            Quantity
                                        </Label>
                                        <Input
                                            id={`part_quantity_${index}`}
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
                                        <Label htmlFor={`part_unit_cost_${index}`} className="text-muted-foreground text-xs">
                                            Unit Cost
                                        </Label>
                                        <Input
                                            id={`part_unit_cost_${index}`}
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
                                        <Label htmlFor={`part_unit_price_${index}`} className="text-muted-foreground text-xs">
                                            Unit Price
                                        </Label>
                                        <Input
                                            id={`part_unit_price_${index}`}
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
                                        <Label htmlFor={`part_category_${index}`} className="text-muted-foreground text-xs">
                                            Category
                                        </Label>
                                        <Select
                                            value={item.category || ''}
                                            onValueChange={(value) => updateItem(item.id, 'category', value)}
                                            disabled={!isEditing}
                                        >
                                            <SelectTrigger className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                                isEditing 
                                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                                    : 'bg-card dark:bg-[#131313]'
                                            }`}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEMPLATE_CATEGORIES.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_warranty_${index}`} className="text-muted-foreground text-xs">
                                            Warranty
                                        </Label>
                                        <Input
                                            id={`part_warranty_${index}`}
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

            {/* Add Part Button at Bottom - Only show when editing and items exist */}
            {isEditing && items.length > 0 && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Part
                    </Button>
                </div>
            )}

            {/* Save as Template Dialog */}
            <Dialog open={!!saveTemplateItem} onOpenChange={(open) => !open && closeSaveTemplateDialog()}>
                <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-foreground">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-full">
                                <BookmarkPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            Save as Template
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Save this part item as a template for future use.
                        </DialogDescription>
                    </DialogHeader>

                    {saveTemplateItem && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="template-name" className="text-foreground">
                                    Template Name *
                                </Label>
                                <Input
                                    id="template-name"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g., Oil Filter - Standard"
                                    className="bg-white dark:bg-background border-border text-foreground"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-white dark:bg-background rounded-lg p-4 border border-border space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Template Values</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="ml-2 text-foreground">Part</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Quantity:</span>
                                        <span className="ml-2 text-foreground">{saveTemplateItem.quantity}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Unit Price:</span>
                                        <span className="ml-2 text-foreground">${saveTemplateItem.unit_price.toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total:</span>
                                        <span className="ml-2 text-foreground font-medium">${saveTemplateItem.total_price.toFixed(2)}</span>
                                    </div>
                                    {saveTemplateItem.part_number && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Part #:</span>
                                            <span className="ml-2 text-foreground">{saveTemplateItem.part_number}</span>
                                        </div>
                                    )}
                                    {saveTemplateItem.category && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Category:</span>
                                            <span className="ml-2 text-foreground">{saveTemplateItem.category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(saveTemplateItem.unit_price <= 0 || saveTemplateItem.quantity <= 0) && (
                                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-3">
                                    <p className="text-orange-600 dark:text-orange-300 text-sm">
                                        Please ensure the item has a valid quantity and unit price before saving as a template.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={closeSaveTemplateDialog}
                            disabled={createTemplateMutation.isPending}
                            className="border-border"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAsTemplate}
                            disabled={
                                createTemplateMutation.isPending ||
                                !templateName.trim() ||
                                !saveTemplateItem ||
                                saveTemplateItem.unit_price <= 0 ||
                                saveTemplateItem.quantity <= 0
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {createTemplateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Template
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

