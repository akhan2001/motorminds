// Unified form item types and validation schemas
import { z } from 'zod'
import { WorkOrderItemType } from './work-order-items'

/**
 * Unified form item interface used across all work order item forms.
 * This replaces the separate LaborFormItem, PartFormItem, and GenericFormItem interfaces.
 */
export interface UnifiedFormItem {
  id: string
  item_type: WorkOrderItemType
  description: string

  // Quantity and pricing (required for all types except labor which uses labor_hours)
  quantity: number
  unit_price: number
  total_price: number
  unit_cost?: number

  // Labor-specific fields
  labor_hours?: number
  technician_id?: string

  // Part-specific fields
  part_number?: string
  supplier?: string
  warranty_period?: string

  // Common optional fields
  category?: string
  notes?: string

  // Form-specific fields (not in database)
  isNew?: boolean // Indicates if this is a new item not yet saved
  hasChanges?: boolean // Indicates if the item has unsaved changes
}

/**
 * Configuration for each item type defining required and optional fields
 */
export interface ItemTypeConfig {
  type: WorkOrderItemType
  label: string
  requiredFields: (keyof UnifiedFormItem)[]
  optionalFields: (keyof UnifiedFormItem)[]
  defaultQuantity: number
  allowNegativePrice: boolean
  useQuantity: boolean // If false, uses labor_hours instead
  icon?: string
  color?: string
}

/**
 * Item type configurations defining behavior for each type
 */
export const ITEM_TYPE_CONFIGS: Record<WorkOrderItemType, ItemTypeConfig> = {
  labor: {
    type: 'labor',
    label: 'Labor',
    requiredFields: ['description', 'labor_hours', 'unit_price'],
    optionalFields: ['technician_id', 'category', 'notes', 'unit_cost'],
    defaultQuantity: 1,
    allowNegativePrice: false,
    useQuantity: false,
    icon: '🔧',
    color: 'blue'
  },
  part: {
    type: 'part',
    label: 'Part',
    requiredFields: ['description', 'quantity', 'unit_price'],
    optionalFields: ['part_number', 'supplier', 'category', 'warranty_period', 'unit_cost', 'notes'],
    defaultQuantity: 1,
    allowNegativePrice: false,
    useQuantity: true,
    icon: '⚙️',
    color: 'green'
  },
  service: {
    type: 'service',
    label: 'Service',
    requiredFields: ['description', 'quantity', 'unit_price'],
    optionalFields: ['category', 'labor_hours', 'unit_cost', 'notes'],
    defaultQuantity: 1,
    allowNegativePrice: false,
    useQuantity: true,
    icon: '🛠️',
    color: 'purple'
  },
  fee: {
    type: 'fee',
    label: 'Fee',
    requiredFields: ['description', 'quantity', 'unit_price'],
    optionalFields: ['category', 'unit_cost', 'notes'],
    defaultQuantity: 1,
    allowNegativePrice: false,
    useQuantity: true,
    icon: '💰',
    color: 'yellow'
  },
  discount: {
    type: 'discount',
    label: 'Discount',
    requiredFields: ['description', 'quantity', 'unit_price'],
    optionalFields: ['category', 'unit_cost', 'notes'],
    defaultQuantity: 1,
    allowNegativePrice: true, // Discounts can have negative prices
    useQuantity: true,
    icon: '🏷️',
    color: 'red'
  },
  package: {
    type: 'package',
    label: 'Package',
    requiredFields: ['description', 'quantity', 'unit_price'],
    optionalFields: ['category', 'labor_hours', 'unit_cost', 'notes'],
    defaultQuantity: 1,
    allowNegativePrice: false,
    useQuantity: true,
    icon: '📦',
    color: 'indigo'
  }
}

/**
 * Base validation schema for all item types
 */
const baseItemSchema = z.object({
  id: z.string(),
  item_type: z.enum(['labor', 'part', 'service', 'fee', 'discount', 'package']),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit_price: z.number(),
  total_price: z.number(),
  unit_cost: z.number().optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  isNew: z.boolean().optional(),
  hasChanges: z.boolean().optional()
})

/**
 * Labor item validation schema
 */
export const laborItemSchema = baseItemSchema.extend({
  item_type: z.literal('labor'),
  labor_hours: z.number()
    .min(0.1, 'Labor hours must be at least 0.1')
    .max(1000, 'Labor hours cannot exceed 1000'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  technician_id: z.string().optional()
})

/**
 * Part item validation schema
 */
export const partItemSchema = baseItemSchema.extend({
  item_type: z.literal('part'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  part_number: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  warranty_period: z.string().max(100).optional()
})

/**
 * Service item validation schema
 */
export const serviceItemSchema = baseItemSchema.extend({
  item_type: z.literal('service'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  labor_hours: z.number().min(0).optional()
})

/**
 * Fee item validation schema
 */
export const feeItemSchema = baseItemSchema.extend({
  item_type: z.literal('fee'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative')
})

/**
 * Discount item validation schema - allows negative prices
 */
export const discountItemSchema = baseItemSchema.extend({
  item_type: z.literal('discount'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().max(0, 'Discount price must be zero or negative')
})

/**
 * Package item validation schema
 */
export const packageItemSchema = baseItemSchema.extend({
  item_type: z.literal('package'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  labor_hours: z.number().min(0).optional()
})

/**
 * Discriminated union of all item schemas
 */
export const unifiedItemSchema = z.discriminatedUnion('item_type', [
  laborItemSchema,
  partItemSchema,
  serviceItemSchema,
  feeItemSchema,
  discountItemSchema,
  packageItemSchema
])

/**
 * Helper function to get the appropriate schema for an item type
 */
export function getSchemaForItemType(itemType: WorkOrderItemType): z.ZodSchema {
  switch (itemType) {
    case 'labor':
      return laborItemSchema
    case 'part':
      return partItemSchema
    case 'service':
      return serviceItemSchema
    case 'fee':
      return feeItemSchema
    case 'discount':
      return discountItemSchema
    case 'package':
      return packageItemSchema
  }
}

/**
 * Helper function to validate a form item
 */
export function validateFormItem(item: UnifiedFormItem): {
  success: boolean
  errors?: Record<string, string[]>
  data?: UnifiedFormItem
} {
  try {
    const schema = getSchemaForItemType(item.item_type)
    const result = schema.parse(item)
    return { success: true, data: result as UnifiedFormItem }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _form: ['Validation failed'] } }
  }
}

/**
 * Helper function to create a default form item for a given type
 */
export function createDefaultFormItem(
  itemType: WorkOrderItemType,
  overrides?: Partial<UnifiedFormItem>
): UnifiedFormItem {
  const config = ITEM_TYPE_CONFIGS[itemType]

  return {
    id: crypto.randomUUID(),
    item_type: itemType,
    description: '',
    quantity: config.defaultQuantity,
    unit_price: 0,
    total_price: 0,
    isNew: true,
    hasChanges: false,
    ...overrides
  }
}

/**
 * Helper function to calculate total price for a form item
 */
export function calculateTotalPrice(item: UnifiedFormItem): number {
  const config = ITEM_TYPE_CONFIGS[item.item_type]

  if (config.useQuantity) {
    return item.quantity * item.unit_price
  } else {
    // Labor uses labor_hours instead of quantity
    return (item.labor_hours || 0) * item.unit_price
  }
}

/**
 * Helper function to check if a field is required for a given item type
 */
export function isFieldRequired(
  itemType: WorkOrderItemType,
  fieldName: keyof UnifiedFormItem
): boolean {
  const config = ITEM_TYPE_CONFIGS[itemType]
  return config.requiredFields.includes(fieldName)
}

/**
 * Helper function to check if a field is visible for a given item type
 */
export function isFieldVisible(
  itemType: WorkOrderItemType,
  fieldName: keyof UnifiedFormItem
): boolean {
  const config = ITEM_TYPE_CONFIGS[itemType]
  return config.requiredFields.includes(fieldName) || config.optionalFields.includes(fieldName)
}

/**
 * Helper function to convert UnifiedFormItem to WorkOrderItemFormData
 */
export function formItemToWorkOrderItem(item: UnifiedFormItem) {
  return {
    item_type: item.item_type,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    unit_cost: item.unit_cost,
    part_number: item.part_number,
    supplier: item.supplier,
    category: item.category,
    warranty_period: item.warranty_period,
    notes: item.notes,
    labor_hours: item.labor_hours,
    technician_id: item.technician_id
  }
}
