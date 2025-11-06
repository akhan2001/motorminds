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
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            {items.map((item, index) => (
                <div key={item.id} className="flex items-end gap-2">
                    <div className="flex-grow">
                        {index === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                        <Input
                            className="bg-white dark:bg-background text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full"
                            placeholder={`Enter ${title.toLowerCase()} description`}
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                    </div>
                     {title === 'Parts' && (
                        <div className="w-20">
                            {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                            <Input
                                className="bg-white dark:bg-background text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full text-center"
                                placeholder="1"
                                type="number"
                                value={item.quantity ?? '1'}
                                onChange={(e) => {
                                    if (parseFloat(e.target.value) < 1) return;
                                    updateItem(item.id, 'quantity', e.target.value);
                                }}
                            />
                        </div>
                    )}
                    {title === 'Parts' && (
                         <div className="w-32">
                            {index === 0 && <Label className="text-xs text-muted-foreground">Shop Cost</Label>}
                            <div className="relative">
                                <span className="text-muted-foreground text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                                <Input
                                    className="bg-white dark:bg-background text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full pl-6"
                                    placeholder="0.00"
                                    type="number"
                                    value={item.shop_cost ?? '0'}
                                    onChange={(e) => {
                                        if (parseFloat(e.target.value) < 0) return;
                                        updateItem(item.id, 'shop_cost', e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="w-32">
                        {index === 0 && <Label className="text-xs text-muted-foreground">Price</Label>}
                        <div className="relative">
                            <span className="text-muted-foreground text-md self-center absolute left-2 top-1/2 -translate-y-1/2">$</span>
                            <Input
                                className="bg-white dark:bg-background text-foreground text-sm border-border focus:ring-red-600 dark:focus:ring-red-500 w-full pl-6"
                                placeholder="0.00"
                                type="number"
                                value={item.cost}
                                onChange={(e) => {
                                    if (parseFloat(e.target.value) < 0) return;
                                    updateItem(item.id, 'cost', e.target.value);
                                }}
                            />
                        </div>
                    </div>
                    <div className="pb-px">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-background border-border text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-600 hover:text-red-700 dark:hover:text-white"
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
                    className="bg-white dark:bg-background border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted hover:text-foreground"
                    onClick={addItem}
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add {title} Item
                </Button>
            )}
        </div>
    );
} 