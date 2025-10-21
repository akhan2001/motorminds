"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Package, CheckCircle, XCircle } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../../types/work-order-items";
import { WorkOrderItemsService } from "../../../lib/work-order-items-service";

interface PartFormItem {
    id: string;
    description: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    supplier?: string;
    category?: string;
    warranty_period?: string;
    notes?: string;
    active?: boolean; // true = accepted, false = declined, undefined = pending
}

interface WorkOrderPartsItemsProps {
    items: PartFormItem[];
    onItemsChange: (items: PartFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
    isEditing?: boolean; // Whether the work order is in edit mode
}

export function WorkOrderPartsItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    onItemSaved,
    isEditing = true
}: WorkOrderPartsItemsProps) {
    
    // Helper function to convert form item to service format
    const convertToWorkOrderItem = (item: PartFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: 'part' as const,
        description: item.description,
        part_number: item.part_number,
        quantity: item.quantity,
        unit_price: item.unit_price,
        supplier: item.supplier,
        category: item.category,
        warranty_period: item.warranty_period,
        notes: item.notes,
    });

    // Function to save item to database
    const saveItemToDatabase = async (item: PartFormItem) => {
        if (!workOrderId) {
            toast.error('Work Order ID is required to save items');
            return;
        }

        if (!item.description.trim()) {
            toast.error('Description is required');
            return;
        }

        if (item.quantity <= 0) {
            toast.error('Quantity must be greater than 0');
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
            supplier: "",
            category: "",
            warranty_period: "",
            notes: "",
            active: undefined // pending by default
        }]);
    };

    const acceptItem = async (id: string) => {
        const updatedItems = items.map(item => 
            item.id === id ? { ...item, active: true } : item
        );
        onItemsChange(updatedItems);
        
        // Save to database if workOrderId exists
        if (workOrderId) {
            try {
                const item = items.find(item => item.id === id);
                if (item) {
                    await WorkOrderItemsService.updateWorkOrderItem(id, { active: true });
                    toast.success('Part item accepted and saved');
                }
            } catch (error: any) {
                console.error('Error updating part item:', error);
                toast.error('Failed to save acceptance status');
                // Revert local state on error
                const revertedItems = items.map(item => 
                    item.id === id ? { ...item, active: undefined } : item
                );
                onItemsChange(revertedItems);
            }
        } else {
            toast.success('Part item accepted');
        }
    };

    const declineItem = async (id: string) => {
        const updatedItems = items.map(item => 
            item.id === id ? { ...item, active: false } : item
        );
        onItemsChange(updatedItems);
        
        // Save to database if workOrderId exists
        if (workOrderId) {
            try {
                const item = items.find(item => item.id === id);
                if (item) {
                    await WorkOrderItemsService.updateWorkOrderItem(id, { active: false });
                    toast.info('Part item declined and saved');
                }
            } catch (error: any) {
                console.error('Error updating part item:', error);
                toast.error('Failed to save decline status');
                // Revert local state on error
                const revertedItems = items.map(item => 
                    item.id === id ? { ...item, active: undefined } : item
                );
                onItemsChange(revertedItems);
            }
        } else {
            toast.info('Part item declined');
        }
    };

    const removeItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof PartFormItem, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id !== id) return item;
            
            let updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields
            if (field === 'quantity' || field === 'unit_price') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updatedItem[field] = numValue;
            } else {
                (updatedItem as any)[field] = value;
            }
            
            // Calculate total price when quantity or unit price changes
            if (field === 'quantity' || field === 'unit_price') {
                updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
            }
            
            return updatedItem;
        });
        
        onItemsChange(updatedItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Parts Items</h3>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-[#2a2a2a] rounded-lg">
                    No parts items added yet. Click "Add Part" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className={`bg-[#1a1a1a] border rounded-lg p-4 ${
                            item.active === true ? 'border-green-500/30 bg-green-500/5' : 
                            item.active === false ? 'border-red-500/30 bg-red-500/5' : 
                            'border-[#2a2a2a]'
                        }`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-green-400">Part Item {index + 1}</h4>
                                    {item.active === true && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                                            Accepted
                                        </span>
                                    )}
                                    {item.active === false && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                            Declined
                                        </span>
                                    )}
                                </div>
                                {isEditing && (
                                    <div className="flex items-center gap-1">
                                        {/* Accept/Decline buttons */}
                                        {item.active !== true && (
                                            <Button
                                                type="button"
                                                onClick={() => acceptItem(item.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-7 w-7 p-0"
                                                title="Accept"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {item.active !== false && (
                                            <Button
                                                type="button"
                                                onClick={() => declineItem(item.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7 p-0"
                                                title="Decline"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-gray-300 hover:bg-gray-900/20 h-7 w-7 p-0"
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
                                        <Label htmlFor={`part_description_${index}`} className="text-gray-400 text-xs">
                                            Description *
                                        </Label>
                                        <Input
                                            id={`part_description_${index}`}
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            placeholder="e.g., Brake pads, Oil filter"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_number_${index}`} className="text-gray-400 text-xs">
                                            Part Number
                                        </Label>
                                        <Input
                                            id={`part_number_${index}`}
                                            value={item.part_number || ''}
                                            onChange={(e) => updateItem(item.id, 'part_number', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            placeholder="P/N"
                                        />
                                    </div>
                                </div>

                                {/* Quantity, Unit Price, Total */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor={`part_quantity_${index}`} className="text-gray-400 text-xs">
                                            Quantity *
                                        </Label>
                                        <Input
                                            id={`part_quantity_${index}`}
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_unit_price_${index}`} className="text-gray-400 text-xs">
                                            Unit Price *
                                        </Label>
                                        <Input
                                            id={`part_unit_price_${index}`}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_total_${index}`} className="text-gray-400 text-xs">
                                            Total Price
                                        </Label>
                                        <Input
                                            id={`part_total_${index}`}
                                            type="number"
                                            value={item.total_price.toFixed(2)}
                                            disabled
                                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Supplier, Category, Warranty */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor={`part_supplier_${index}`} className="text-gray-400 text-xs">
                                            Supplier
                                        </Label>
                                        <Input
                                            id={`part_supplier_${index}`}
                                            value={item.supplier || ''}
                                            onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            placeholder="Supplier name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_category_${index}`} className="text-gray-400 text-xs">
                                            Category
                                        </Label>
                                        <Input
                                            id={`part_category_${index}`}
                                            value={item.category || ''}
                                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            placeholder="Category"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`part_warranty_${index}`} className="text-gray-400 text-xs">
                                            Warranty
                                        </Label>
                                        <Input
                                            id={`part_warranty_${index}`}
                                            value={item.warranty_period || ''}
                                            onChange={(e) => updateItem(item.id, 'warranty_period', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            disabled={!isEditing}
                                            placeholder="12 months"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes !== undefined && (
                                    <div>
                                        <Label htmlFor={`part_notes_${index}`} className="text-gray-400 text-xs">
                                            Notes (Optional)
                                        </Label>
                                        <Textarea
                                            id={`part_notes_${index}`}
                                            value={item.notes || ''}
                                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
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
                <div className="pt-3 border-t border-[#2a2a2a]">
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
        </div>
    );
}