/**
 * Work Order Items Constants - Single Source of Truth
 */

export const WORK_ORDER_ITEM_TYPES = {
    LABOR: 'labor',
    PART: 'part',
    SERVICE: 'service',
    FEE: 'fee',
    DISCOUNT: 'discount',
    PACKAGE: 'package',
    EXPENSE: 'expense',
} as const

export type WorkOrderItemType =
    typeof WORK_ORDER_ITEM_TYPES[keyof typeof WORK_ORDER_ITEM_TYPES]

export const ITEM_TYPE_LABELS: Record<WorkOrderItemType, string> = {
    [WORK_ORDER_ITEM_TYPES.LABOR]: 'Labor',
    [WORK_ORDER_ITEM_TYPES.PART]: 'Part',
    [WORK_ORDER_ITEM_TYPES.SERVICE]: 'Service',
    [WORK_ORDER_ITEM_TYPES.FEE]: 'Fee',
    [WORK_ORDER_ITEM_TYPES.DISCOUNT]: 'Discount',
    [WORK_ORDER_ITEM_TYPES.PACKAGE]: 'Package',
    [WORK_ORDER_ITEM_TYPES.EXPENSE]: 'Expense',
}

/**
 * Calculation methods for different item types
 */
export const ITEM_CALCULATION_METHODS = {
    LABOR: 'labor_hours * unit_price',
    STANDARD: 'quantity * unit_price',
} as const

/**
 * Template categories (common categories for organizing templates)
 */
export const TEMPLATE_CATEGORIES = {
    MAINTENANCE: 'maintenance',
    REPAIR: 'repair',
    DIAGNOSTIC: 'diagnostic',
    TIRE: 'tire',
    BRAKE: 'brake',
    ENGINE: 'engine',
    TRANSMISSION: 'transmission',
    ELECTRICAL: 'electrical',
    BODY: 'body',
    GENERAL: 'general',
} as const

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[keyof typeof TEMPLATE_CATEGORIES]

/**
 * Helper to check if item type uses labor calculation
 */
export function isLaborItemType(itemType: WorkOrderItemType): boolean {
    return itemType === WORK_ORDER_ITEM_TYPES.LABOR
}

/**
 * Calculate item total based on type
 */
export function calculateItemTotal(
    itemType: WorkOrderItemType,
    quantity: number,
    unitPrice: number,
    laborHours?: number
): number {
    if (isLaborItemType(itemType) && laborHours) {
        return laborHours * unitPrice
    }
    return quantity * unitPrice
}