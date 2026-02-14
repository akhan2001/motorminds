"use client";

import { useState } from "react";
import { Plus, Trash2, Wrench, BookmarkPlus, Save, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

import { TechnicianDropdown } from "@/app/(features)/technician/components/TechnicianDropdown";

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
import { useAuth } from "../../../../hooks/use-auth";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../../lib/work-order-items-service";
import { TemplateDropdown } from "../../../work-order-items/shared";
import type { WorkOrderItemTemplate } from "../../../../types/work-order-item-templates";
import { useCreateWorkOrderItemTemplate } from "../../../../hooks/use-work-order-item-templates";
import { TEMPLATE_CATEGORIES } from "../../../work-order-items/templates/Categories/template-categories";

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
        unit_cost: item.unit_cost || undefined,
        labor_hours: item.labor_hours,
        category: item.category || undefined,
        notes: item.notes || undefined,
        technician_id: item.technician_id || undefined,
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
            toast.success('Service saved successfully');
        } catch (error: any) {
            console.error('Error saving service:', error);
            toast.error(error.message || 'Failed to save service');
        }
    };

    
    const addItem = () => {
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
                toast.success('Service deleted');
                
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
                // NOTE: This is for UI feedback only. The database trigger will calculate the actual total_price on save.
                updatedItem.total_price = updatedItem.labor_hours * updatedItem.unit_price;
            }
            
            return updatedItem;
        });
        
        onItemsChange(updatedItems);
    };

    const { shopId } = useAuth();
    const createTemplateMutation = useCreateWorkOrderItemTemplate();
    const [saveTemplateItem, setSaveTemplateItem] = useState<LaborFormItem | null>(null);
    const [templateName, setTemplateName] = useState('');

    const openSaveTemplateDialog = (item: LaborFormItem) => {
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
        if (saveTemplateItem.labor_hours <= 0) {
            toast.error('Labor hours must be greater than 0');
            return;
        }

        try {
            await createTemplateMutation.mutateAsync({
                shop_id: shopId,
                item_type: 'labor',
                name: templateName.trim(),
                description: saveTemplateItem.notes || undefined,
                quantity: 1,
                unit_price: saveTemplateItem.unit_price,
                unit_cost: saveTemplateItem.unit_cost ?? undefined,
                category: saveTemplateItem.category || undefined,
                labor_hours: saveTemplateItem.labor_hours,
            });
            closeSaveTemplateDialog();
        } catch {
            // Error handled by mutation hook
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-foreground">Labor / Services</h3>
            </div>

            {items.length === 0 ? (
                isEditing ? (
                    <Button
                        type="button"
                        onClick={addItem}
                        variant="outline"
                        className="group w-full py-8 border border-dashed border-border dark:border-[#333333] rounded-lg bg-transparent hover:bg-transparent hover:border-solid hover:border-blue-500/50 dark:hover:border-blue-500/50 text-muted-foreground dark:text-gray-400 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                        Add Labor / Services
                    </Button>
                ) : (
                    <div className="text-center py-8 text-muted-foreground dark:text-gray-400 border border-dashed border-border dark:border-[#333333] rounded-lg bg-card dark:bg-[#131313]">
                        No labor items added yet.
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
                                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Service {index + 1}</h4>
                                </div>
                                {isEditing && (
                                    <div className="flex items-center gap-2">
                                        {item.description && item.unit_price > 0 && item.labor_hours > 0 && (
                                            <Button
                                                type="button"
                                                onClick={() => openSaveTemplateDialog(item)}
                                                variant="outline"
                                                size="sm"
                                                className="border-blue-300 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 h-8 px-3"
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
                                                    
                                                    toast.success('Service created from template');
                                                } catch (error: any) {
                                                    console.error('Error saving labor item from template:', error);
                                                    toast.error('Failed to save service');
                                                    // Revert to original state on error
                                                    onItemsChange(items);
                                                }
                                            }
                                        }}
                                        placeholder="Type here to search for a service template..."
                                        disabled={!isEditing}
                                        className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
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
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
                                            placeholder="2.5"
                                            min="0"
                                            step="0.25"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_rate_${index}`} className="text-muted-foreground text-xs">
                                            Unit Price *
                                        </Label>
                                        <Input
                                            id={`labor_rate_${index}`}
                                            type="number"
                                            value={item.unit_price || ''}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
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
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
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
                                            className={`border-border dark:border-[#333333] text-foreground dark:text-white ${
                                            isEditing 
                                                ? 'bg-background dark:bg-[#1a1a1a]' 
                                                : 'bg-card dark:bg-[#131313]'
                                        }`}
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

            {/* Add Labor Button at Bottom - Only show when editing and items exist */}
            {isEditing && items.length > 0 && (
                <div className="pt-3 border-t border-border">
                    <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Labor / Services
                    </Button>
                </div>
            )}

            {/* Save as Template Dialog */}
            <Dialog open={!!saveTemplateItem} onOpenChange={(open) => !open && closeSaveTemplateDialog()}>
                <DialogContent className="max-w-md bg-slate-50 dark:bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-foreground">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full">
                                <BookmarkPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            Save as Template
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Save this service item as a template for future use.
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
                                    placeholder="e.g., Oil Change - Standard"
                                    className="bg-white dark:bg-background border-border text-foreground"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-white dark:bg-background rounded-lg p-4 border border-border space-y-2">
                                <h4 className="text-sm font-medium text-foreground">Template Values</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="ml-2 text-foreground">Labor / Service</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Labor Hours:</span>
                                        <span className="ml-2 text-foreground">{saveTemplateItem.labor_hours}</span>
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

                            {(saveTemplateItem.unit_price <= 0 || saveTemplateItem.labor_hours <= 0) && (
                                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/20 rounded-lg p-3">
                                    <p className="text-orange-600 dark:text-orange-300 text-sm">
                                        Please ensure the item has a valid labor hours and unit price before saving as a template.
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
                                saveTemplateItem.labor_hours <= 0
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white"
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

