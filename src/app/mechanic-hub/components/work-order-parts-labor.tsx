"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  type: "labor" | "parts"
  description: string
  cost: number
}

interface WorkOrderPartsLaborProps {
  onUpdateTotal: (total: number) => void
  onSelectLabor?: (description: string, cost: number, id: string) => void
  onSelectParts?: (description: string, cost: number, id: string) => void
  onDeselectLabor?: () => void
  onDeselectParts?: () => void
  selectedLaborId?: string
  selectedPartsId?: string
}

const mockItems: Item[] = [
  { id: "1", type: "labor", description: "Oil Change Service", cost: 45.00 },
  { id: "2", type: "parts", description: "Oil Filter", cost: 12.99 },
  { id: "3", type: "parts", description: "5W-30 Synthetic Oil (5L)", cost: 35.99 },
  { id: "4", type: "labor", description: "Brake Inspection", cost: 30.00 },
  { id: "5", type: "parts", description: "Air Filter", cost: 24.99 },
]

export function WorkOrderPartsLabor({ 
  onUpdateTotal, 
  onSelectLabor, 
  onSelectParts,
  onDeselectLabor,
  onDeselectParts,
  selectedLaborId,
  selectedPartsId
}: WorkOrderPartsLaborProps) {
  const [items, setItems] = useState<Item[]>(mockItems)
  const [newItem, setNewItem] = useState<Partial<Item>>({
    type: "labor",
    description: "",
    cost: 0,
  })

  const handleAddItem = () => {
    if (!newItem.description || !newItem.cost) return
    
    const item: Item = {
      id: Date.now().toString(),
      type: newItem.type as "labor" | "parts",
      description: newItem.description,
      cost: Number(newItem.cost),
    }
    
    setItems([...items, item])
    setNewItem({ ...newItem, description: "", cost: 0 })
    updateTotal([...items, item])
  }

  const handleRemoveItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)
    updateTotal(updatedItems)
  }

  const handleItemClick = (item: Item) => {
    if (item.type === "labor") {
      if (selectedLaborId === item.id && onDeselectLabor) {
        // If this item is already selected, deselect it
        onDeselectLabor()
      } else if (onSelectLabor) {
        // Otherwise select it, passing the item ID
        onSelectLabor(item.description, item.cost, item.id)
      }
    } else if (item.type === "parts") {
      if (selectedPartsId === item.id && onDeselectParts) {
        // If this item is already selected, deselect it
        onDeselectParts()
      } else if (onSelectParts) {
        // Otherwise select it, passing the item ID
        onSelectParts(item.description, item.cost, item.id)
      }
    }
  }

  const updateTotal = (currentItems: Item[]) => {
    const total = currentItems.reduce((sum, item) => sum + item.cost, 0)
    onUpdateTotal(total)
  }

  return (
    <div className="w-[350px] bg-[#131313] border-l border-[#222222] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#222222]">
            <h3 className="text-lg font-medium text-white">Labor & Parts</h3>
        </div>

        {/* Add new item form */}
        <div className="p-4 space-y-3 border-b border-[#222222]">
            <Select
            value={newItem.type as string}
            onValueChange={(value: "labor" | "parts") => setNewItem({ ...newItem, type: value })}
            >
            <SelectTrigger className="bg-[#1A1A1A] text-white border-[#333333] focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] text-white border-[#333333]">
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="parts">Parts</SelectItem>
            </SelectContent>
            </Select>

            <Input
            placeholder="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="bg-[#1A1A1A] text-white border-[#333333] focus:ring-0 focus:ring-offset-0"
            />

            <div className="flex gap-2">
                <Input
                    type="number"
                    placeholder="Cost"
                    value={newItem.cost ? newItem.cost.toFixed(2) : ""}
                    onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                    className="bg-[#1A1A1A] text-white border-[#333333] focus:ring-0 focus:ring-offset-0"
                />
                <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#22C55E] text-white hover:bg-[#22C55E]/80 px-3"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
            {items.map((item) => {
                // Check if this item is selected
                const isSelected = 
                (item.type === "labor" && item.id === selectedLaborId) || 
                (item.type === "parts" && item.id === selectedPartsId);
                
                // Border color based on selection and type
                const borderStyle = isSelected 
                ? item.type === "labor" 
                    ? "border-2 border-blue-500" 
                    : "border-2 border-purple-500"
                : "border border-[#333333]";
                
                return (
                <div
                    key={item.id}
                    className={cn(
                    "group p-3 rounded bg-[#1A1A1A] hover:bg-[#222222] transition-colors cursor-pointer",
                    borderStyle
                    )}
                    onClick={() => handleItemClick(item)}
                >
                    <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                        <span
                            className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            item.type === "labor"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-purple-500/20 text-purple-400"
                            )}
                        >
                            {item.type}
                        </span>
                        </div>
                        <p className="text-sm text-white">{item.description}</p>
                        <p className="text-sm text-gray-400">${item.cost.toFixed(2)}</p>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                        e.stopPropagation(); // Prevent the card click event
                        handleRemoveItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
    </div>
  )
}
