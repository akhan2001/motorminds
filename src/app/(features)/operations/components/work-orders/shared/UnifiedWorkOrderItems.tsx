"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TechnicianDropdown } from "@/app/(features)/technician/components/TechnicianDropdown";
import { useAuth } from "../../../hooks/use-auth";
import {
  UnifiedFormItem,
  ITEM_TYPE_CONFIGS,
  calculateTotalPrice,
  isFieldVisible,
  isFieldRequired,
  validateFormItem,
  createDefaultFormItem
} from "../../../types/work-order-item-form";
import { WorkOrderItemType } from "../../../types/work-order-items";
import { useState, useCallback, useEffect } from "react";

interface UnifiedWorkOrderItemsProps {
  itemType: WorkOrderItemType;
  items: UnifiedFormItem[];
  onItemsChange: (items: UnifiedFormItem[]) => void;
  workOrderId?: string;
  isEditing?: boolean;
  maxItems?: number;
}

export function UnifiedWorkOrderItems({
  itemType,
  items,
  onItemsChange,
  workOrderId,
  isEditing = true,
  maxItems = 50
}: UnifiedWorkOrderItemsProps) {
  const { shopId } = useAuth();
  const config = ITEM_TYPE_CONFIGS[itemType];
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string[]>>>({});

  // Validate an item and update validation errors
  const validateItem = useCallback((item: UnifiedFormItem) => {
    const result = validateFormItem(item);
    if (!result.success && result.errors) {
      setValidationErrors(prev => ({
        ...prev,
        [item.id]: result.errors!
      }));
      return false;
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[item.id];
        return newErrors;
      });
      return true;
    }
  }, []);

  const addItem = useCallback(() => {
    if (items.length >= maxItems) {
      toast.error(`Maximum ${maxItems} ${config.label.toLowerCase()} items allowed`);
      return;
    }

    const newItem = createDefaultFormItem(itemType);
    onItemsChange([...items, newItem]);
  }, [items, maxItems, config.label, itemType, onItemsChange]);

  const removeItem = useCallback((id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, [items, onItemsChange]);

  const updateItem = useCallback((id: string, field: keyof UnifiedFormItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, hasChanges: true };

      // Handle numeric fields
      if (field === 'quantity' || field === 'unit_price' || field === 'unit_cost' || field === 'labor_hours') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        updatedItem[field] = numValue as number;
      } else if (field === 'description' || field === 'notes' || field === 'category' ||
                 field === 'part_number' || field === 'supplier' || field === 'warranty_period' ||
                 field === 'technician_id') {
        updatedItem[field] = value as string;
      }

      // Recalculate total price
      updatedItem.total_price = calculateTotalPrice(updatedItem);

      // Validate the updated item
      setTimeout(() => validateItem(updatedItem), 0);

      return updatedItem;
    });

    onItemsChange(updatedItems);
  }, [items, onItemsChange, validateItem]);

  // Auto-focus on description field when new item is added
  useEffect(() => {
    const newItem = items.find(item => item.isNew && !item.description);
    if (newItem) {
      const descriptionInput = document.getElementById(`${itemType}_description_${items.indexOf(newItem)}`);
      descriptionInput?.focus();
    }
  }, [items, itemType]);

  const getFieldError = (itemId: string, fieldName: string): string | undefined => {
    return validationErrors[itemId]?.[fieldName]?.[0];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <h3 className="text-lg font-semibold text-foreground">{config.label} Items</h3>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg bg-slate-50 dark:bg-card">
          No {config.label.toLowerCase()} items added yet. Click "Add {config.label}" to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-card border border-border rounded-lg p-4"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium" style={{ color: config.color }}>
                  {config.label} Item {index + 1}
                </h4>
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
                {/* Description - Always visible */}
                <div>
                  <Label htmlFor={`${itemType}_description_${index}`} className="text-muted-foreground text-xs">
                    Description {isFieldRequired(itemType, 'description') && '*'}
                  </Label>
                  <Input
                    id={`${itemType}_description_${index}`}
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="bg-white dark:bg-background border-border text-foreground"
                    placeholder={`e.g., ${config.type === 'labor' ? 'Oil change, Brake repair' : config.type === 'part' ? 'Oil filter, Brake pads' : `${config.label} description`}`}
                    disabled={!isEditing}
                  />
                  {getFieldError(item.id, 'description') && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {getFieldError(item.id, 'description')}
                    </p>
                  )}
                </div>

                {/* Labor Hours (Labor only) */}
                {isFieldVisible(itemType, 'labor_hours') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${itemType}_labor_hours_${index}`} className="text-muted-foreground text-xs">
                        Labor Hours {isFieldRequired(itemType, 'labor_hours') && '*'}
                      </Label>
                      <Input
                        id={`${itemType}_labor_hours_${index}`}
                        type="number"
                        value={item.labor_hours || ''}
                        onChange={(e) => updateItem(item.id, 'labor_hours', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        placeholder="2.5"
                        min="0"
                        step="0.25"
                        disabled={!isEditing}
                      />
                      {getFieldError(item.id, 'labor_hours') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {getFieldError(item.id, 'labor_hours')}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${itemType}_unit_price_${index}`} className="text-muted-foreground text-xs">
                        Rate per Hour {isFieldRequired(itemType, 'unit_price') && '*'}
                      </Label>
                      <Input
                        id={`${itemType}_unit_price_${index}`}
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        min={config.allowNegativePrice ? undefined : "0"}
                        step="0.01"
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                      {getFieldError(item.id, 'unit_price') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {getFieldError(item.id, 'unit_price')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity and Unit Price (Non-labor items) */}
                {config.useQuantity && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${itemType}_quantity_${index}`} className="text-muted-foreground text-xs">
                        Quantity {isFieldRequired(itemType, 'quantity') && '*'}
                      </Label>
                      <Input
                        id={`${itemType}_quantity_${index}`}
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        placeholder="1"
                        min="0"
                        step="1"
                        disabled={!isEditing}
                      />
                      {getFieldError(item.id, 'quantity') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {getFieldError(item.id, 'quantity')}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${itemType}_unit_price_${index}`} className="text-muted-foreground text-xs">
                        Unit Price {isFieldRequired(itemType, 'unit_price') && '*'}
                      </Label>
                      <Input
                        id={`${itemType}_unit_price_${index}`}
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        min={config.allowNegativePrice ? undefined : "0"}
                        max={config.allowNegativePrice ? "0" : undefined}
                        step="0.01"
                        disabled={!isEditing}
                        placeholder="0.00"
                      />
                      {getFieldError(item.id, 'unit_price') && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {getFieldError(item.id, 'unit_price')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Part-specific fields */}
                {isFieldVisible(itemType, 'part_number') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${itemType}_part_number_${index}`} className="text-muted-foreground text-xs">
                        Part Number
                      </Label>
                      <Input
                        id={`${itemType}_part_number_${index}`}
                        value={item.part_number || ''}
                        onChange={(e) => updateItem(item.id, 'part_number', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        placeholder="e.g., ABC123"
                        disabled={!isEditing}
                      />
                    </div>
                    {isFieldVisible(itemType, 'supplier') && (
                      <div>
                        <Label htmlFor={`${itemType}_supplier_${index}`} className="text-muted-foreground text-xs">
                          Supplier
                        </Label>
                        <Input
                          id={`${itemType}_supplier_${index}`}
                          value={item.supplier || ''}
                          onChange={(e) => updateItem(item.id, 'supplier', e.target.value)}
                          className="bg-white dark:bg-background border-border text-foreground"
                          placeholder="e.g., AutoZone"
                          disabled={!isEditing}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Warranty Period (Parts only) */}
                {isFieldVisible(itemType, 'warranty_period') && (
                  <div>
                    <Label htmlFor={`${itemType}_warranty_${index}`} className="text-muted-foreground text-xs">
                      Warranty Period
                    </Label>
                    <Input
                      id={`${itemType}_warranty_${index}`}
                      value={item.warranty_period || ''}
                      onChange={(e) => updateItem(item.id, 'warranty_period', e.target.value)}
                      className="bg-white dark:bg-background border-border text-foreground"
                      placeholder="e.g., 12 months"
                      disabled={!isEditing}
                    />
                  </div>
                )}

                {/* Technician (Labor items) */}
                {isFieldVisible(itemType, 'technician_id') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${itemType}_technician_${index}`} className="text-muted-foreground text-xs">
                        Technician
                      </Label>
                      <TechnicianDropdown
                        shopId={shopId || ''}
                        selectedTechnicianId={item.technician_id || ''}
                        onTechnicianSelect={(technicianId) =>
                          updateItem(item.id, 'technician_id', technicianId === 'none' ? '' : technicianId)
                        }
                        placeholder="Select Technician"
                        className="w-full"
                        showNoneOption={true}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Total Price
                      </Label>
                      <Input
                        type="text"
                        value={`$${item.total_price.toFixed(2)}`}
                        disabled
                        className="bg-slate-50 dark:bg-muted border-border text-foreground font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Category (if visible and not labor with technician) */}
                {isFieldVisible(itemType, 'category') && !isFieldVisible(itemType, 'technician_id') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${itemType}_category_${index}`} className="text-muted-foreground text-xs">
                        Category
                      </Label>
                      <Input
                        id={`${itemType}_category_${index}`}
                        value={item.category || ''}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        className="bg-white dark:bg-background border-border text-foreground"
                        placeholder="e.g., Maintenance"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Total Price
                      </Label>
                      <Input
                        type="text"
                        value={`$${item.total_price.toFixed(2)}`}
                        disabled
                        className="bg-slate-50 dark:bg-muted border-border text-foreground font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Unit Cost (Optional) */}
                {isFieldVisible(itemType, 'unit_cost') && (
                  <div>
                    <Label htmlFor={`${itemType}_unit_cost_${index}`} className="text-muted-foreground text-xs">
                      Unit Cost (Optional)
                    </Label>
                    <Input
                      id={`${itemType}_unit_cost_${index}`}
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
                )}

                {/* Notes */}
                {isFieldVisible(itemType, 'notes') && (
                  <div>
                    <Label htmlFor={`${itemType}_notes_${index}`} className="text-muted-foreground text-xs">
                      Notes
                    </Label>
                    <Textarea
                      id={`${itemType}_notes_${index}`}
                      value={item.notes || ''}
                      onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                      className="bg-white dark:bg-background border-border text-foreground"
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

      {/* Add Item Button */}
      {isEditing && (
        <div className="pt-3 border-t border-border">
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {config.label}
          </Button>
        </div>
      )}
    </div>
  );
}
