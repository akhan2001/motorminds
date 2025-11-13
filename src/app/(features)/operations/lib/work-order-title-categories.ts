/**
 * Default work order title categories
 * These are common categories used for work order titles
 */
export const WORK_ORDER_TITLE_CATEGORIES = [
    'Maintenance',
    'Service',
    'Repair',
    'Diagnostic',
    'Inspection',
    'Oil Change',
    'Brake Service',
    'Tire Service',
    'Engine Repair',
    'Transmission Service',
    'Electrical Service',
    'AC Service',
    'Suspension Service',
    'Battery Service',
    'Alignment',
    'Exhaust Service',
    'Other'
] as const

export type WorkOrderTitleCategory = typeof WORK_ORDER_TITLE_CATEGORIES[number]

export const OTHER_CATEGORY = 'Other' as const

