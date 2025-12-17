/**
 * Work Order contants - single source of truth
 */

export const WORK_ORDER_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    IN_PROGRESS: 'in_progress',
    WAITING_PARTS: 'waiting_parts',
    WAITING_CUSTOMER: 'waiting_customer',
    READY: 'ready',
    COMPLETED: 'completed',
    INVOICED: 'invoiced',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on_hold',
} as const

export type WorkOrderStatus = typeof WORK_ORDER_STATUS[keyof typeof WORK_ORDER_STATUS]

export const WORK_ORDER_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
} as const

export type WorkOrderPriority = typeof WORK_ORDER_PRIORITY[keyof typeof WORK_ORDER_PRIORITY]

/**
 * Kanban column groupings - SINGLE SOURCE OF TRUTH
 * Used throughout the application for filtering and display
 */
export const KANBAN_COLUMNS = {
    ESTIMATES: [WORK_ORDER_STATUS.PENDING, WORK_ORDER_STATUS.APPROVED],
    IN_PROGRESS: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.WAITING_PARTS,
        WORK_ORDER_STATUS.WAITING_CUSTOMER,
    ],
    READY: [WORK_ORDER_STATUS.READY],
    COMPLETED: [WORK_ORDER_STATUS.COMPLETED, WORK_ORDER_STATUS.INVOICED],
} as const

/**
 * Status labels for UI display
 */
export const STATUS_TO_LABEL: Record<WorkOrderStatus, string> = {
    [WORK_ORDER_STATUS.PENDING]: 'Pending',
    [WORK_ORDER_STATUS.APPROVED]: 'Approved',
    [WORK_ORDER_STATUS.IN_PROGRESS]: 'In Progress',
    [WORK_ORDER_STATUS.WAITING_PARTS]: 'Waiting for Parts',
    [WORK_ORDER_STATUS.WAITING_CUSTOMER]: 'Waiting for Customer',
    [WORK_ORDER_STATUS.READY]: 'Ready',
    [WORK_ORDER_STATUS.COMPLETED]: 'Completed',
    [WORK_ORDER_STATUS.INVOICED]: 'Invoiced',
    [WORK_ORDER_STATUS.CANCELLED]: 'Cancelled',
    [WORK_ORDER_STATUS.ON_HOLD]: 'On Hold',
}

/**
 * Status groups for styling and business logic
 */
export const STATUS_GROUPS = {
    ACTIVE: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.WAITING_PARTS,
        WORK_ORDER_STATUS.WAITING_CUSTOMER,
    ],
    COMPLETED: [WORK_ORDER_STATUS.COMPLETED, WORK_ORDER_STATUS.INVOICED],
    CANCELLED: [WORK_ORDER_STATUS.CANCELLED],
    ARCHIVED: [WORK_ORDER_STATUS.INVOICED], // Auto-archived statuses
} as const

/**
 * Valid status transitions
 * Prevents invalid state changes
 */
export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
    [WORK_ORDER_STATUS.PENDING]: [
        WORK_ORDER_STATUS.APPROVED,
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.CANCELLED,
        WORK_ORDER_STATUS.ON_HOLD,
    ],
    [WORK_ORDER_STATUS.APPROVED]: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.PENDING,
        WORK_ORDER_STATUS.CANCELLED,
    ],
    [WORK_ORDER_STATUS.IN_PROGRESS]: [
        WORK_ORDER_STATUS.WAITING_PARTS,
        WORK_ORDER_STATUS.WAITING_CUSTOMER,
        WORK_ORDER_STATUS.READY,
        WORK_ORDER_STATUS.COMPLETED,
        WORK_ORDER_STATUS.ON_HOLD,
    ],
    [WORK_ORDER_STATUS.WAITING_PARTS]: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.READY,
        WORK_ORDER_STATUS.COMPLETED,
    ],
    [WORK_ORDER_STATUS.WAITING_CUSTOMER]: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.READY,
        WORK_ORDER_STATUS.COMPLETED,
    ],
    [WORK_ORDER_STATUS.READY]: [
        WORK_ORDER_STATUS.COMPLETED,
        WORK_ORDER_STATUS.IN_PROGRESS,
    ],
    [WORK_ORDER_STATUS.COMPLETED]: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.READY,
        WORK_ORDER_STATUS.INVOICED,
    ],
    [WORK_ORDER_STATUS.INVOICED]: [], // Terminal state - cannot transition
    [WORK_ORDER_STATUS.CANCELLED]: [], // Terminal state - cannot transition
    [WORK_ORDER_STATUS.ON_HOLD]: [
        WORK_ORDER_STATUS.IN_PROGRESS,
        WORK_ORDER_STATUS.CANCELLED,
    ],
}

/**
 * Helper function to check if status transition is valid
 */
export function isValidStatusTransition(
    from: WorkOrderStatus,
    to: WorkOrderStatus
): boolean {
    return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}