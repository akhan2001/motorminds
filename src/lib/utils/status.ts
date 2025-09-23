// Status and badge-related utility functions

export type UserStatus = 'active' | 'inactive' | 'suspended'
export type UserPlan = 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE'

/**
 * Get CSS classes for user status badge
 */
export function getStatusColor(status?: UserStatus | string): string {
    switch (status) {
        case 'active':
            return 'bg-green-500 text-white'
        case 'inactive':
            return 'bg-gray-500 text-white'
        case 'suspended':
            return 'bg-red-500 text-white'
        default:
            return 'bg-gray-500 text-white'
    }
}

/**
 * Get CSS classes for user plan badge
 */
export function getPlanColor(plan?: UserPlan | string): string {
    switch (plan) {
        case 'PREMIUM':
            return 'bg-blue-500 text-white'
        case 'ENTERPRISE':
            return 'bg-purple-500 text-white'
        case 'DEFAULT':
        default:
            return 'bg-gray-600 text-white'
    }
}

/**
 * Capitalize first letter of status for display
 */
export function formatStatus(status?: UserStatus | string): string {
    if (!status) return ''
    return status.charAt(0).toUpperCase() + status.slice(1)
}

/**
 * Get user-friendly plan name
 */
export function formatPlan(plan?: UserPlan | string): string {
    switch (plan) {
        case 'DEFAULT':
            return 'Basic'
        case 'PREMIUM':
            return 'Premium'
        case 'ENTERPRISE':
            return 'Enterprise'
        default:
            return 'Basic'
    }
}

/**
 * Check if status is considered "healthy" (active)
 */
export function isStatusHealthy(status?: UserStatus | string): boolean {
    return status === 'active'
}

/**
 * Check if plan is a paid plan
 */
export function isPaidPlan(plan?: UserPlan | string): boolean {
    return plan === 'PREMIUM' || plan === 'ENTERPRISE'
}

/**
 * Get CSS classes for priority indicators
 */
export function getPriorityColor(priority?: 'low' | 'medium' | 'high' | 'urgent'): string {
    switch (priority) {
        case 'low':
            return 'bg-green-500'
        case 'medium':
            return 'bg-yellow-500'
        case 'high':
            return 'bg-orange-500'
        case 'urgent':
            return 'bg-red-500'
        default:
            return 'bg-gray-500'
    }
}
