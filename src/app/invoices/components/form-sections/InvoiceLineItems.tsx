"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface LineItem {
    id: string;
    description: string;
    cost: string;
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
        onItemsChange([...items, { id: uuidv4(), description: "", cost: "0" }]);
    };

    const removeItem = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: 'description' | 'cost', value: string) => {
        const cleanedValue = field === 'cost' ? value.replace(/^0+/, '') || "0" : value;
        onItemsChange(
            items.map(item =>
                item.id === id ? { ...item, [field]: cleanedValue } : item
            )
        );
    };

    return (
        <div className="sm:col-span-3 space-y-2">
            {items.map((item) => (
                <div key={item.id} className="flex flex-row gap-2">
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                        placeholder={`Enter ${title.toLowerCase()} description`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                    <span className="text-gray-300 text-md self-center">$</span>
                    <Input
                        className="bg-[#0000] text-white text-sm border-[#626262] focus:ring-gray-500 w-full"
                        placeholder="Enter cost"
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateItem(item.id, 'cost', e.target.value)}
                    />
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