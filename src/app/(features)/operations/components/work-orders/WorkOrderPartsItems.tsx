"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MinusIcon, PlusIcon, Package, Save } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../types/work-order-items";
import { WorkOrderItemsService } from "../../lib/work-order-items-service";

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
}

interface WorkOrderPartsItemsProps {
    items: PartFormItem[];
    onItemsChange: (items: PartFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
}

export function WorkOrderPartsItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    onItemSaved 
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
            notes: ""
        }]);
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
        <div className="sm:col-span-3 space-y-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-white">Parts Items</h3>
            </div>
            
            {items.map((item, index) => (
                <div key={item.id} className="space-y-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    {/* First Row: Description and Part Number */}
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            {index === 0 && <Label className="text-xs text-gray-400">Part Description</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="Enter part description (e.g., Brake pads, Oil filter)"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                        </div>
                        
                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Part Number</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="P/N"
                                value={item.part_number || ''}
                                onChange={(e) => updateItem(item.id, 'part_number', e.target.value)}
                            />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-1 pb-px">
                            {/* Save Button - Only show if workOrderId is provided */}
                            {workOrderId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-600 border-green-600 text-white hover:bg-green-700 hover:text-white"
                                    onClick={() => saveItemToDatabase(item)}
                                    disabled={!item.description.trim() || item.quantity <= 0}
                                    title="Save to work order"
                                >
                                    <Save className="h-4 w-4" />
                                </Button>
                            )}
                            
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-[#292929] border-[#626262] text-red-400 hover:bg-red-600 hover:text-white"
                                onClick={() => removeItem(item.id)}
                            >
                                <MinusIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Second Row: Quantity, Unit Price, Total */}
                    <div className="flex items-end gap-2">
                        <div className="w-24">
                            {index === 0 && <Label className="text-xs text-gray-400">Qty</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="1"
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                    if (parseInt(e.target.value) < 1) return;
                                    updateItem(item.id, 'quantity', e.target.value);
                                }}
                            />
                        </div>
                        
                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Unit Price</Label>}
                            <div className="relative">
                                <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                                <Input
                                    className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full pl-6"
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.unit_price}
                                    onChange={(e) => {
                                        if (parseFloat(e.target.value) < 0) return;
                                        updateItem(item.id, 'unit_price', e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Total</Label>}
                            <div className="relative">
                                <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                                <Input
                                    className="bg-[#0d0d0d] text-gray-300 text-sm border-[#626262] w-full pl-6"
                                    value={item.total_price.toFixed(2)}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="flex-grow">
                            {index === 0 && <Label className="text-xs text-gray-400">Supplier</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="Supplier name"
                                value={item.supplier || ''}
                                onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Third Row: Category, Warranty, Notes */}
                    <div className="flex items-end gap-2">
                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Category</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="Category"
                                value={item.category || ''}
                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            />
                        </div>

                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Warranty</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="12 months"
                                value={item.warranty_period || ''}
                                onChange={(e) => updateItem(item.id, 'warranty_period', e.target.value)}
                            />
                        </div>

                        <div className="flex-grow">
                            {index === 0 && <Label className="text-xs text-gray-400">Notes (Optional)</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="Additional notes or special instructions..."
                                value={item.notes || ''}
                                onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}
            
            {items.length < 20 && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-[#292929] border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                    onClick={addItem}
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Part Item
                </Button>
            )}
        </div>
    );
}