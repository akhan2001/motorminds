"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Wrench } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { TechnicianDropdown } from "@/app/(features)/technician/components/TechnicianDropdown";
import { useAuth } from "../../hooks/use-auth";
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
            
            const updatedItem = { ...item };
            
            // Convert string values to numbers for numeric fields
            if (field === 'labor_hours' || field === 'unit_price') {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updatedItem[field] = numValue as number;
            } else if (field === 'technician_id' || field === 'description' || field === 'notes') {
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
                <Wrench className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Labor Items</h3>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed border-[#2a2a2a] rounded-lg">
                    No labor items added yet. Click "Add Labor" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h4 className="text-sm font-medium text-blue-400">Labor Item {index + 1}</h4>
                                <Button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {/* Description */}
                                <div>
                                    <Label htmlFor={`labor_description_${index}`} className="text-gray-400 text-xs">
                                        Description *
                                    </Label>
                                    <Input
                                        id={`labor_description_${index}`}
                                        value={item.description}
                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                        className="bg-[#111111] border-[#2a2a2a] text-white"
                                        placeholder="e.g., Oil change, Brake repair"
                                    />
                                </div>

                                {/* Labor Hours and Rate */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`labor_hours_${index}`} className="text-gray-400 text-xs">
                                            Labor Hours
                                        </Label>
                                        <Input
                                            id={`labor_hours_${index}`}
                                            type="number"
                                            value={item.labor_hours || ''}
                                            onChange={(e) => updateItem(item.id, 'labor_hours', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            placeholder="2.5"
                                            min="0"
                                            step="0.25"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_rate_${index}`} className="text-gray-400 text-xs">
                                            Rate per Hour *
                                        </Label>
                                        <Input
                                            id={`labor_rate_${index}`}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Technician and Total */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor={`technician_${index}`} className="text-gray-400 text-xs">
                                            Technician (Optional)
                                        </Label>
                                        <TechnicianDropdown
                                            shopId={shopId || ''}
                                            selectedTechnicianId={item.technician_id || ''}
                                            onTechnicianSelect={(technicianId) => updateItem(item.id, 'technician_id', technicianId === 'none' ? '' : technicianId)}
                                            placeholder="Select Technician"
                                            className="bg-[#111111] border-[#2a2a2a]"
                                            showNoneOption={true}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`labor_total_${index}`} className="text-gray-400 text-xs">
                                            Total Price
                                        </Label>
                                        <Input
                                            id={`labor_total_${index}`}
                                            type="number"
                                            value={item.total_price.toFixed(2)}
                                            disabled
                                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white font-semibold"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {item.notes !== undefined && (
                                    <div>
                                        <Label htmlFor={`labor_notes_${index}`} className="text-gray-400 text-xs">
                                            Notes (Optional)
                                        </Label>
                                        <Textarea
                                            id={`labor_notes_${index}`}
                                            value={item.notes || ''}
                                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                            className="bg-[#111111] border-[#2a2a2a] text-white"
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

            {/* Add Labor Button at Bottom */}
            <div className="pt-3 border-t border-[#2a2a2a]">
                <Button
                    type="button"
                    onClick={addItem}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Labor
                </Button>
            </div>
        </div>
    );
} 