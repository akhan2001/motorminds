"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MinusIcon, PlusIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface LineItem {
    id: string;
    description: string;
    cost: string;
    shop_cost?: string; // Optional for labour items
    quantity?: string;
}

interface InvoiceLineItemsProps {
    title: string;
    items: LineItem[];
    onItemsChange: (items: LineItem[]) => void;
}

export function InvoiceLineItems({ title, items, onItemsChange }: InvoiceLineItemsProps) {
    
    const addItem = () => {
        if (items.length >= 10) {
            toast.error(`Maximum 10 ${title.toLowerCase()} items allowed`);
            return;
        }
        onItemsChange([...items, { id: uuidv4(), description: "", cost: "0", shop_cost: "0", quantity: "1" }]);
    };

    const removeItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: 'description' | 'cost' | 'shop_cost' | 'quantity', value: string) => {
        const cleanedValue = (field === 'cost' || field === 'shop_cost' || field === 'quantity') ? value.replace(/^0+/, '') || "0" : value;
        onItemsChange(
            items.map(item =>
                item.id === id ? { ...item, [field]: cleanedValue } : item
            )
        );
    };

    return (
        <div className="sm:col-span-3 space-y-4">
            <h3 className="text-lg font-medium">{title}</h3>
            {items.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2">
                    <div className="flex-grow">
                        {index === 0 && <Label className="text-xs text-gray-400">Description</Label>}
                        <Input
                            className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                            placeholder={`Enter ${title.toLowerCase()} description`}
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                    </div>
                     {title === 'Parts' && (
                        <div className="w-20">
                            {index === 0 && <Label className="text-xs text-gray-400">Qty</Label>}
                            <Input
                                className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full text-center"
                                placeholder="1"
                                type="number"
                                value={item.quantity ?? '1'}
                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            />
                        </div>
                    )}
                    {title === 'Parts' && (
                         <div className="w-32">
                            {index === 0 && <Label className="text-xs text-gray-400">Shop Cost</Label>}
                            <div className="relative">
                                <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                                <Input
                                    className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full pl-6"
                                    placeholder="0.00"
                                    type="number"
                                    value={item.shop_cost ?? '0'}
                                    onChange={(e) => updateItem(item.id, 'shop_cost', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <div className="w-32">
                        {index === 0 && <Label className="text-xs text-gray-400">Price</Label>}
                        <div className="relative">
                            <span className="text-gray-300 text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                            <Input
                                className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full pl-6"
                                placeholder="0.00"
                                type="number"
                                value={item.cost}
                                onChange={(e) => updateItem(item.id, 'cost', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="pb-px">
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
                    Add {title} Item
                </Button>
            )}
        </div>
    );
} 