"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Wrench } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { TechnicianDropdown } from "@/app/(features)/technician/components/TechnicianDropdown";
import { useAuth } from "../../../hooks/use-auth";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../types/work-order-item-templates";

interface LaborFormItem {
    id: string;
    description: string;
    labor_hours: number;
    unit_price: number;
    total_price: number;
    unit_cost?: number;
    category?: string;
    notes?: string;
    technician_id?: string;
}

interface WorkOrderLaborItemsProps {
    items: LaborFormItem[];
    onItemsChange: (items: LaborFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    technicianOptions?: { id: string; name: string }[];
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
    onItemDeleted?: (itemId: string) => void; // Callback when item is deleted from database
    isEditing?: boolean; // Whether the work order is in edit mode
}

export function WorkOrderLaborItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    technicianOptions = [], 
    onItemSaved,
    onItemDeleted,
    isEditing = true
}: WorkOrderLaborItemsProps) {

    // Helper function to convert form item to service format
    const convertToWorkOrderItem = (item: LaborFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: 'labor' as const,
        description: item.description,
        quantity: 1, // Labor items typically have quantity of 1
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        labor_hours: item.labor_hours,
        category: item.category,
        notes: item.notes,
        technician_id: item.technician_id,
    });

    // Function to save item to database
    const saveItemToDatabase = async (item: LaborFormItem) => {
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
            toast.success('Labor item saved successfully');
        } catch (error: any) {
            console.error('Error saving labor item:', error);
            toast.error(error.message || 'Failed to save labor item');
        }
    };

    
    const addItem = () => {
        if (items.length >= 10) {
            toast.error(`Maximum 10 labor items allowed`);
            return;
        }
        onItemsChange([...items, { 
            id: uuidv4(), 
            description: "", 
            labor_hours: 1, 
            unit_price: 0,
            total_price: 0,
            unit_cost: 0,
            category: "",
            notes: "",
            technician_id: ""
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
                toast.success('Labor item deleted');
                
                // Notify parent component for optimistic updates
                onItemDeleted?.(id);
            } catch (error: any) {
                // If item doesn't exist in database, that's fine - it was only local
                if (error.message?.includes('not found')) {
                    console.log('Item was only local, no database deletion needed');
                } else {
                    console.error('Error deleting labor item:', error);
                    toast.error('Failed to delete item from database');
                    // Revert local state on error
                    onItemsChange(items);
                }
            }
        }
    };

    const updateItem = (id: string, field: keyof LaborFormItem, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id !== id) return item;
            
            const updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields
            if (field === 'labor_hours' || field === 'unit_price') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updatedItem[field] = numValue as number;
            } else if (field === 'unit_cost') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updatedItem[field] = numValue as number;
            } else if (field === 'technician_id' || field === 'description' || field === 'notes' || field === 'category') {
                updatedItem[field] = value as string;
            }
            
            // Calculate total price when hours or unit price changes
            if (field === 'labor_hours' || field === 'unit_price') {
                updatedItem.total_price = updatedItem.labor_hours * updatedItem.unit_price;
            }
            
            return updatedItem;
        });
        
        onItemsChange(updatedItems);
    };

    const { shopId } = useAuth();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-foreground">Labor Items</h3>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-slate-50 dark:bg-card">
                    No labor items added yet. Click "Add Labor" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className="bg-white dark:bg-card border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Labor Item {index + 1}</h4>
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
                                {/* Description with Template Dropdown */}
                                <div>
                                    <Label htmlFor={`labor_description_${index}`} className="text-muted-foreground text-xs">
                                        Description *
                                    </Label>
                                    <TemplateDropdown
                                        shopId={shopId || ''}
                                        itemType="labor"
                                        value={item.description}
                                        onChange={(value) => updateItem(item.id, 'description', value)}
                                        onTemplateSelect={async (template: WorkOrderItemTemplate) => {
                                            // Create updated item with template data
                                            const updatedItem = {
                                                ...item,
                                                description: template.name,
                                                labor_hours: template.labor_hours || 1,
                                                unit_price: template.unit_price,
                                                total_price: (template.labor_hours || 1) * template.unit_price,
                                                unit_cost: template.unit_cost,
                                                category: template.category || item.category,
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
                                                    
                                                    toast.success('Labor item created from template');
                                                } catch (error: any) {
                                                    console.error('Error saving labor item from template:', error);
                                                    toast.error('Failed to save labor item');
                                                    // Revert to original state on error
                                                    onItemsChange(items);
                                                }
                                            }
                                        }}
                                        placeholder="e.g., Oil change, Brake repair"
                                        disabled={!isEditing}
                                        className="bg-white dark:bg-background border-border text-foreground"
                                    />
                                </div>

                                {/* Labor Hours and Rate */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`labor_hours_${index}`} className="text-muted-foreground text-xs">
                                            Labor Hours
                                        </Label>
                                        <Input
                                            id={`labor_hours_${index}`}
                                            type="number"
                                            value={item.labor_hours || ''}
                                            onChange={(e) => updateItem(item.id, 'labor_hours', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            placeholder="2.5"
                                            min="0"
                                            step="0.25"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_rate_${index}`} className="text-muted-foreground text-xs">
                                            Rate per Hour *
                                        </Label>
                                        <Input
                                            id={`labor_rate_${index}`}
                                            type="number"
                                            value={item.unit_price || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            min="0"
                                            step="0.01"
                                            disabled={!isEditing}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Unit Cost and Category */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`labor_unit_cost_${index}`} className="text-muted-foreground text-xs">
                                            Unit Cost (Optional)
                                        </Label>
                                        <Input
                                            id={`labor_unit_cost_${index}`}
                                            type="number"
                                            value={item.unit_cost || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_cost', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            min="0"
                                            step="0.01"
                                            disabled={!isEditing}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_category_${index}`} className="text-muted-foreground text-xs">
                                            Category (Optional)
                                        </Label>
                                        <Input
                                            id={`labor_category_${index}`}
                                            type="text"
                                            value={item.category || ''}
                                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground"
                                            disabled={!isEditing}
                                            placeholder="e.g., engine, transmission"
                                        />
                                    </div>
                                </div>

                                {/* Technician and Total */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`technician_${index}`} className="text-muted-foreground text-xs">
                                            Technician (Optional)
                                        </Label>
                                        <TechnicianDropdown
                                            shopId={shopId || ''}
                                            selectedTechnicianId={item.technician_id || ''}
                                            onTechnicianSelect={(technicianId) => updateItem(item.id, 'technician_id', technicianId === 'none' ? '' : technicianId)}
                                            placeholder="Select Technician"
                                            className="w-full"
                                            showNoneOption={true}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_total_${index}`} className="text-muted-foreground text-xs">
                                            Total Price
                                        </Label>
                                        <Input
                                            id={`labor_total_${index}`}
                                            type="number"
                                            value={item.total_price.toFixed(2)}
                                            disabled
                                            className="bg-slate-50 dark:bg-muted border-border text-foreground font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes !== undefined && (
                                    <div>
                                        <Label htmlFor={`labor_notes_${index}`} className="text-muted-foreground text-xs">
                                            Notes (Optional)
                                        </Label>
                                        <Textarea
                                            id={`labor_notes_${index}`}
                                            value={item.notes || ''}
                                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                            className="bg-white dark:bg-background border-border text-foreground min-h-[60px] max-h-[120px]"
                                            placeholder="Additional notes..."
                                            rows={2}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Labor Button at Bottom - Only show when editing */}
            {isEditing && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Labor
                    </Button>
                </div>
            )}
        </div>
    );
} 