"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Plus, Trash2, DollarSign, Tag, Package as PackageIcon, Save, Loader2, BookmarkPlus } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemCreateData } from "../../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../../types/work-order-item-templates";
import { useAuth } from "../../../../hooks/use-auth";
import { useCreateWorkOrderItemTemplate } from "../../../../hooks/use-work-order-item-templates";

interface GenericFormItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit_cost?: number;
    category?: string;
    labor_hours?: number; // For packages and services
    notes?: string;
}

interface WorkOrderGenericItemsProps {
    items: GenericFormItem[];
    onItemsChange: (items: GenericFormItem[]) => void;
    workOrderId?: string;
    onItemSaved?: (item: WorkOrderItem) => void;
    onItemDeleted?: (itemId: string) => void;
    isEditing?: boolean;
    itemType: 'service' | 'fee' | 'discount' | 'package';
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    readOnly?: boolean; // If true, hide add button and make fields read-only, but allow deletion
}

export function WorkOrderGenericItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    onItemSaved,
    onItemDeleted,
    isEditing = true,
    itemType,
    title,
    icon: Icon = DollarSign,
    readOnly = false
}: WorkOrderGenericItemsProps) {

    const { shopId } = useAuth();
    const createTemplateMutation = useCreateWorkOrderItemTemplate();
    const [saveTemplateItem, setSaveTemplateItem] = useState<GenericFormItem | null>(null);
    const [templateName, setTemplateName] = useState('');

    // Helper function to convert form item to service format
    const convertToWorkOrderItem = (item: GenericFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: itemType,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost || undefined,
        category: item.category || undefined,
        labor_hours: item.labor_hours || undefined,
        notes: item.notes || undefined,
    });

    // Function to save item to database
    const saveItemToDatabase = async (item: GenericFormItem) => {
        if (!workOrderId) {
            toast.error('Work Order ID is required to save items');
            return;
        }

        if (!item.description.trim()) {
            toast.error('Description is required');
            return;
        }

        try {
            const itemData = convertToWorkOrderItem(item);
            const savedItem = await WorkOrderItemsService.createWorkOrderItem(itemData);
            onItemSaved?.(savedItem);
            toast.success(`${title} item saved successfully`);
        } catch (error: any) {
            console.error(`Error saving ${itemType} item:`, error);
            toast.error(error.message || `Failed to save ${itemType} item`);
        }
    };

    const addItem = () => {
        onItemsChange([...items, { 
            id: uuidv4(), 
            description: "", 
            quantity: 1,
            unit_price: 0,
            total_price: 0,
            unit_cost: 0,
            category: "",
            labor_hours: 0,
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
                toast.success(`${title.slice(0, -1)} item deleted`);
                
                // Notify parent component for optimistic updates
                onItemDeleted?.(id);
            } catch (error: any) {
                // If item doesn't exist in database, that's fine - it was only local
                if (error.message?.includes('not found')) {
                    console.log('Item was only local, no database deletion needed');
                } else {
                    console.error(`Error deleting ${itemType} item:`, error);
                    toast.error('Failed to delete item from database');
                    // Revert local state on error
                    onItemsChange(items);
                }
            }
        }
    };

    const updateItem = (id: string, field: keyof GenericFormItem, value: any) => {
        if (readOnly) return; // Don't allow updates in read-only mode
        onItemsChange(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate total
                // NOTE: This is for UI feedback only. The database trigger will calculate the actual total_price on save.
                if (field === 'quantity' || field === 'unit_price') {
                    const quantity = field === 'quantity' ? (value || 0) : updated.quantity;
                    const unitPrice = field === 'unit_price' ? (value || 0) : updated.unit_price;
                    updated.total_price = quantity * unitPrice;
                }
                return updated;
            }
            return item;
        }));
    };

    // Open save as template dialog
    const openSaveTemplateDialog = (item: GenericFormItem) => {
        setSaveTemplateItem(item);
        setTemplateName(item.description || '');
    };

    // Close save as template dialog
    const closeSaveTemplateDialog = () => {
        setSaveTemplateItem(null);
        setTemplateName('');
    };

    // Handle save as template
    const handleSaveAsTemplate = async () => {
        if (!saveTemplateItem || !shopId) return;

        // Validate required fields
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
                item_type: itemType,
                name: templateName.trim(),
                description: saveTemplateItem.notes || null,
                quantity: saveTemplateItem.quantity,
                unit_price: saveTemplateItem.unit_price,
                unit_cost: saveTemplateItem.unit_cost || null,
                category: saveTemplateItem.category || null,
                labor_hours: saveTemplateItem.labor_hours || null,
            });
            closeSaveTemplateDialog();
        } catch (error) {
            // Error is handled by the mutation hook
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-base font-medium text-foreground">{title}</h4>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                    {readOnly && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                            Read-only
                        </Badge>
                    )}
                </div>
                {/* Only show Add button if editing and not read-only */}
                {/* {isEditing && !readOnly && (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        size="sm"
                        className="border-border dark:border-[#626262] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#626262] hover:text-foreground dark:hover:text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add {title}
                    </Button>
                )} */}
            </div>

            {items.length === 0 ? (
                isEditing && !readOnly ? (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        className="group w-full py-6 border border-dashed border-border rounded-lg bg-transparent hover:bg-transparent hover:border-solid hover:border-blue-500/50 text-muted-foreground text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                        Add {title}
                    </Button>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                        No {itemType} items added yet
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className={`border border-border dark:border-[#333333] rounded-lg p-4 ${
                                isEditing 
                                    ? 'bg-background dark:bg-[#1a1a1a]' 
                                    : 'bg-card dark:bg-[#131313]'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                </div>
                                {isEditing && (
                                    <div className="flex items-center gap-2">
                                        {/* Save as Template Button */}
                                        {!readOnly && item.description && item.unit_price > 0 && (
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
                                            variant="outline"
                                            size="sm"
                                            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-3"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <Label className="text-muted-foreground text-xs">Description *</Label>
                                    <TemplateDropdown
                                        shopId={shopId || ''}
                                        itemType={itemType}
                                        value={item.description}
                                        onChange={(value) => !readOnly && updateItem(item.id, 'description', value)}
                                        onTemplateSelect={async (template: WorkOrderItemTemplate) => {
                                            if (readOnly) return; // Don't allow template selection in read-only mode
                                            // Create updated item with template data
                                            // For discounts, store as positive values (will be subtracted in calculations)
                                            let unitPrice = Math.abs(template.unit_price || 0);

                                            const updatedItem = {
                                                ...item,
                                                description: template.name,
                                                quantity: template.quantity,
                                                unit_price: unitPrice,
                                                total_price: template.quantity * unitPrice,
                                                unit_cost: template.unit_cost,
                                                category: template.category || item.category,
                                                labor_hours: template.labor_hours || item.labor_hours,
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
                                                    
                                                    toast.success(`${title.slice(0, -1)} item created from template`);
                                                } catch (error: any) {
                                                    console.error(`Error saving ${itemType} item from template:`, error);
                                                    toast.error(`Failed to save ${itemType} item`);
                                                    // Revert to original state on error
                                                    onItemsChange(items);
                                                }
                                            }
                                        }}
                                        placeholder={`Type here to search for a ${itemType} template...`}
                                        disabled={!isEditing || readOnly}
                                        className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Quantity</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="1"
                                        className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                        disabled={!isEditing || readOnly}  
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Unit Price</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_price === 0 ? '0' : item.unit_price || ''}
                                        onChange={(e) => {
                                            let value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                                            // For discounts, store as positive values (will be subtracted in calculations)
                                            if (itemType === 'discount') {
                                                value = Math.abs(value);
                                            }
                                            updateItem(item.id, 'unit_price', value);
                                        }}
                                        min={itemType === 'discount' ? undefined : "0"}
                                        step="0.01"
                                        className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                        disabled={!isEditing || readOnly}
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Unit Cost (Optional)</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_cost || ''}
                                        onChange={(e) => updateItem(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="0.01"
                                        className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                        disabled={!isEditing || readOnly}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Category (Optional)</Label>
                                    <Input
                                        type="text"
                                        value={item.category || ''}
                                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                        className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                        disabled={!isEditing || readOnly}  
                                        placeholder="e.g., engine, transmission"
                                    />
                                </div>

                                {/* Labor Hours field for packages and services */}
                                {(itemType === 'package' || itemType === 'service') && (
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Labor Hours (Optional)</Label>
                                        <Input
                                            type="number"
                                            value={item.labor_hours || ''}
                                            onChange={(e) => updateItem(item.id, 'labor_hours', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.25"
                                            className={`text-foreground dark:text-white border-border dark:border-[#333333] mt-1 ${
                                            isEditing && !readOnly
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                            disabled={!isEditing || readOnly}
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <Label className="text-muted-foreground text-xs">Notes</Label>
                                    <Textarea
                                        value={item.notes || ''}
                                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                        placeholder="Additional notes..."
                                        className="bg-white dark:bg-background text-foreground border-border mt-1 min-h-[60px] max-h-[120px]"
                                        disabled={!isEditing || readOnly}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-card rounded-lg border border-border">
                                        <span className="text-muted-foreground text-sm">Total:</span>
                                        <span className="text-foreground font-semibold text-lg">
                                            ${item.total_price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                            Save this {itemType} item as a template for future use.
                        </DialogDescription>
                    </DialogHeader>

                    {saveTemplateItem && (
                        <div className="space-y-4">
                            {/* Template Name */}
                            <div className="space-y-2">
                                <Label htmlFor="template-name" className="text-foreground">
                                    Template Name *
                                </Label>
                                <Input
                                    id="template-name"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g., 10% Loyalty Discount"
                                    className="bg-white dark:bg-background border-border text-foreground"
                                    autoFocus
                                />
                            </div>

                            {/* Preview of template values */}
                            <div className="bg-white dark:bg-background rounded-lg p-4 border border-border space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Template Values</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="ml-2 text-foreground capitalize">{itemType}</span>
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
                                    {saveTemplateItem.category && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Category:</span>
                                            <span className="ml-2 text-foreground">{saveTemplateItem.category}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Validation Messages */}
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

