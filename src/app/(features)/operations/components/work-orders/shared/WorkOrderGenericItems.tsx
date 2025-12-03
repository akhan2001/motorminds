"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, DollarSign, Tag, Package as PackageIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemCreateData } from "../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../types/work-order-item-templates";
import { useAuth } from '@/lib/auth/AuthProvider'

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
    icon: Icon = DollarSign
}: WorkOrderGenericItemsProps) {

    const { shopId } = useAuth();

    // Helper function to convert form item to service format
    const convertToWorkOrderItem = (item: GenericFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: itemType,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        category: item.category,
        labor_hours: item.labor_hours,
        notes: item.notes,
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
        if (items.length >= 10) {
            toast.error(`Maximum 10 ${itemType} items allowed`);
            return;
        }
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
        onItemsChange(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // Recalculate total
                if (field === 'quantity' || field === 'unit_price') {
                    updated.total_price = updated.quantity * updated.unit_price;
                }
                return updated;
            }
            return item;
        }));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-base font-medium text-foreground">{title}</h4>
                    <span className="text-sm text-muted-foreground">({items.length})</span>
                </div>
                {isEditing && (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        size="sm"
                        className="border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add {title}
                    </Button>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-slate-50 dark:bg-card">
                    No {itemType} items added yet
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-card border border-border rounded-lg p-4"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                </div>
                                {isEditing && (
                                    <Button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        variant="outline"
                                        size="sm"
                                        className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-3"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <Label className="text-muted-foreground text-xs">Description *</Label>
                                    <TemplateDropdown
                                        shopId={shopId || ''}
                                        itemType={itemType}
                                        value={item.description}
                                        onChange={(value) => updateItem(item.id, 'description', value)}
                                        onTemplateSelect={async (template: WorkOrderItemTemplate) => {
                                            // Create updated item with template data
                                            let unitPrice = template.unit_price;
                                            // For discounts, ensure the unit price is negative
                                            if (itemType === 'discount' && unitPrice > 0) {
                                                unitPrice = -unitPrice;
                                            }

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
                                        disabled={!isEditing}
                                        className="bg-white dark:bg-background text-foreground border-border mt-1"
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
                                        className="bg-white dark:bg-background text-foreground border-border mt-1"
                                        disabled={!isEditing}  
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Unit Price</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                        min={itemType === 'discount' ? undefined : "0"}
                                        step="0.01"
                                        className="bg-white dark:bg-background text-foreground border-border mt-1"
                                        disabled={!isEditing}
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
                                        className="bg-white dark:bg-background text-foreground border-border mt-1"
                                        disabled={!isEditing}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label className="text-muted-foreground text-xs">Category (Optional)</Label>
                                    <Input
                                        type="text"
                                        value={item.category || ''}
                                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                        className="bg-white dark:bg-background text-foreground border-border mt-1"
                                        disabled={!isEditing}  
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
                                            className="bg-white dark:bg-background text-foreground border-border mt-1"
                                            disabled={!isEditing}
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
                                        disabled={!isEditing}
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
        </div>
    );
}

