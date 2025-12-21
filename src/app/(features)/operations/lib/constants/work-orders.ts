// Work Order Constants
// Centralized constants for work order statuses, priorities, and validation

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

// Editable statuses - work orders in these statuses can be edited
export const EDITABLE_STATUSES: readonly WorkOrderStatus[] = [
    WORK_ORDER_STATUS.PENDING,
    WORK_ORDER_STATUS.APPROVED,
    WORK_ORDER_STATUS.IN_PROGRESS,
    WORK_ORDER_STATUS.WAITING_PARTS,
    WORK_ORDER_STATUS.WAITING_CUSTOMER,
    WORK_ORDER_STATUS.ON_HOLD,
    WORK_ORDER_STATUS.READY,
] as const

// Deletable statuses - work orders in these statuses can be deleted/archived
export const DELETABLE_STATUSES: readonly WorkOrderStatus[] = [
    ...EDITABLE_STATUSES,
    WORK_ORDER_STATUS.COMPLETED,
] as const

// Statuses that allow item editing
export const ITEM_EDITABLE_STATUSES: readonly WorkOrderStatus[] = [
    WORK_ORDER_STATUS.PENDING,
    WORK_ORDER_STATUS.APPROVED,
    WORK_ORDER_STATUS.IN_PROGRESS,
    WORK_ORDER_STATUS.WAITING_PARTS,
    WORK_ORDER_STATUS.WAITING_CUSTOMER,
    WORK_ORDER_STATUS.ON_HOLD,
    WORK_ORDER_STATUS.READY,
] as const

// Statuses that show financial summary
export const FINANCIAL_SUMMARY_STATUSES: readonly WorkOrderStatus[] = [
    WORK_ORDER_STATUS.APPROVED,
    WORK_ORDER_STATUS.IN_PROGRESS,
    WORK_ORDER_STATUS.READY,
] as const

// Statuses that allow MIA insights
export const MIA_INSIGHTS_STATUSES: readonly WorkOrderStatus[] = [
    WORK_ORDER_STATUS.READY,
] as const

/**
 * Check if a work order can be edited
 */
export function canEditWorkOrder(status: string): boolean {
    return EDITABLE_STATUSES.includes(status as WorkOrderStatus)
}

/**
 * Check if a work order can be deleted/archived
 */
export function canDeleteWorkOrder(status: string): boolean {
    return DELETABLE_STATUSES.includes(status as WorkOrderStatus)
}

/**
 * Check if work order items can be edited
 */
export function canEditWorkOrderItems(status: string): boolean {
    return ITEM_EDITABLE_STATUSES.includes(status as WorkOrderStatus)
}

/**
 * Check if financial summary should be shown
 */
export function shouldShowFinancialSummary(status: string): boolean {
    return FINANCIAL_SUMMARY_STATUSES.includes(status as WorkOrderStatus)
}

/**
 * Check if MIA insights should be available
 */
export function shouldShowMiaInsights(status: string): boolean {
    return MIA_INSIGHTS_STATUSES.includes(status as WorkOrderStatus)
}

/**
 * Get status display label
 */
export function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
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
    return labels[status] || status
}

/**
 * Get priority display label
 */
export function getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
        [WORK_ORDER_PRIORITY.LOW]: 'Low',
        [WORK_ORDER_PRIORITY.MEDIUM]: 'Medium',
        [WORK_ORDER_PRIORITY.HIGH]: 'High',
        [WORK_ORDER_PRIORITY.URGENT]: 'Urgent',
    }
    return labels[priority] || priority
}

/**
 * Kanban column configuration
 * Defines the columns displayed in the work orders Kanban board
 */
export const KANBAN_COLUMNS_CONFIG = [
    {
        id: 'pending',
        title: 'Estimates',
        color: 'bg-yellow-500',
        statuses: [WORK_ORDER_STATUS.PENDING, WORK_ORDER_STATUS.APPROVED] as const,
    },
    {
        id: 'in-progress',
        title: 'In Progress',
        color: 'bg-blue-500',
        statuses: [
            WORK_ORDER_STATUS.IN_PROGRESS,
            WORK_ORDER_STATUS.WAITING_PARTS,
            WORK_ORDER_STATUS.WAITING_CUSTOMER,
        ] as const,
    },
    {
        id: 'ready',
        title: 'Ready',
        color: 'bg-purple-500',
        statuses: [WORK_ORDER_STATUS.READY] as const,
    },
    {
        id: 'completed',
        title: 'Completed',
        color: 'bg-green-500',
        statuses: [WORK_ORDER_STATUS.COMPLETED, WORK_ORDER_STATUS.INVOICED] as const,
    },
] as const
