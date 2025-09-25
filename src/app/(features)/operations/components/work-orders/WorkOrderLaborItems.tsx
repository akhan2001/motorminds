"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MinusIcon, PlusIcon, Clock, Save } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { WorkOrderItem, WorkOrderItemFormData, WorkOrderItemCreateData } from "../../types/work-order-items";
import { WorkOrderItemsService } from "../../lib/work-order-items-service";

interface LaborFormItem {
    id: string;
    description: string;
    labor_hours: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    technician_id?: string;
}

interface WorkOrderLaborItemsProps {
    items: LaborFormItem[];
    onItemsChange: (items: LaborFormItem[]) => void;
    workOrderId?: string; // Optional for creating items
    technicianOptions?: { id: string; name: string }[];
    onItemSaved?: (item: WorkOrderItem) => void; // Callback when item is saved to database
}

export function WorkOrderLaborItems({ 
    items, 
    onItemsChange, 
    workOrderId, 
    technicianOptions = [], 
    onItemSaved 
}: WorkOrderLaborItemsProps) {
    
    // Helper function to convert form item to service format
    const convertToWorkOrderItem = (item: LaborFormItem): WorkOrderItemCreateData => ({
        work_order_id: workOrderId!,
        item_type: 'labor' as const,
        description: item.description,
        quantity: 1, // Labor items typically have quantity of 1
        unit_price: item.unit_price,
        labor_hours: item.labor_hours,
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
            notes: "",
            technician_id: ""
        }]);
    };

    const removeItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof LaborFormItem, value: string | number) => {
        const updatedItems = items.map(item => {
            if (item.id !== id) return item;
            
            let updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields
            if (field === 'labor_hours' || field === 'unit_price') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updatedItem[field] = numValue;
            } else {
                updatedItem[field] = value as any;
            }
            
            // Calculate total price when hours or unit price changes
            if (field === 'labor_hours' || field === 'unit_price') {
                updatedItem.total_price = updatedItem.labor_hours * updatedItem.unit_price;
            }
            
            return updatedItem;
        });
        
        onItemsChange(updatedItems);
    };

    return (
        <div className="sm:col-span-3 space-y-4">
            <div className="flex items-center gap-2 mt-2">
                <h3 className="text-lg font-medium text-white">Labor Items</h3>
            </div>
            
            {items.map((item, index) => (
                <div key={item.id} className="space-y-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
                    {/* First Row: Description */}
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            {index === 0 && <Label className="text-xs text-gray-400">Labor Description</Label>}
                            <Input
                                className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                                placeholder="Enter labor description (e.g., Oil change, Brake inspection)"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
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
                                    disabled={!item.description.trim()}
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

                    {/* Second Row: Hours, Rate, Total */}
                    <div className="flex items-end gap-2">
                        <div className="w-24">
                            {index === 0 && <Label className="text-xs text-gray-400">Hours</Label>}
                            <div className="relative">
                                <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full pl-8"
                                    placeholder="1.0"
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={item.labor_hours}
                                    onChange={(e) => {
                                        if (parseFloat(e.target.value) < 0) return;
                                        updateItem(item.id, 'labor_hours', e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Rate/Hour</Label>}
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
                                    value={item.total_price}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Third Row: Notes (Optional) */}
                    <div>
                        {index === 0 && <Label className="text-xs text-gray-400">Notes (Optional)</Label>}
                        <Input
                            className="bg-[#0d0d0d] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                            placeholder="Additional notes or special instructions..."
                            value={item.notes || ''}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        />
                    </div>
                </div>
            ))}
            
            {items.length < 10 && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-[#292929] border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                    onClick={addItem}
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Labor Item
                </Button>
            )}
        </div>
    );
} 