// User role and management utility functions

export type UserRole = 'admin' | 'owner' | 'manager' | 'employee' | 'user'

export interface User {
    id?: string
    role?: string
    plan?: string
    status?: string
    shop_id?: string
}

/**
 * Find the primary user from a list of users (admin > owner > first user)
 */
export function findPrimaryUser(users: User[]): User | undefined {
    if (!users || users.length === 0) return undefined
    
    // Priority: admin -> owner -> manager -> first user
    return users.find(u => u.role === 'admin') ||
           users.find(u => u.role === 'owner') ||
           users.find(u => u.role === 'manager') ||
           users[0]
}

/**
 * Group users by shop_id
 */
export function groupUsersByShop(users: User[]): Record<string, User[]> {
    return users.reduce((acc, user) => {
        if (user.shop_id) {
            if (!acc[user.shop_id]) {
                acc[user.shop_id] = []
            }
            acc[user.shop_id].push(user)
        }
        return acc
    }, {} as Record<string, User[]>)
}

/**
 * Count users by status
 */
export function countUsersByStatus(users: User[]): Record<string, number> {
    return users.reduce((acc, user) => {
        const status = user.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {} as Record<string, number>)
}

/**
 * Count users by plan
 */
export function countUsersByPlan(users: User[]): Record<string, number> {
    return users.reduce((acc, user) => {
        const plan = user.plan || 'DEFAULT'
        acc[plan] = (acc[plan] || 0) + 1
        return acc
    }, {} as Record<string, number>)
}

/**
 * Check if user has admin privileges
 */
export function hasAdminPrivileges(user: User): boolean {
    return user.role === 'admin'
}

/**
 * Check if user has management privileges (admin or owner)
 */
export function hasManagementPrivileges(user: User): boolean {
    return user.role === 'admin' || user.role === 'owner' || user.role === 'manager'
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(role: string): number {
    const roleLevels = {
        'admin': 5,
        'owner': 4,
        'manager': 3,
        'employee': 2,
        'user': 1
    }
    return roleLevels[role as UserRole] || 0
}

/**
 * Check if user A has higher privileges than user B
 */
export function hasHigherPrivileges(userA: User, userB: User): boolean {
    return getRoleLevel(userA.role || '') > getRoleLevel(userB.role || '')
}

/**
 * Filter users by role
 */
export function filterUsersByRole(users: User[], role: UserRole): User[] {
    return users.filter(user => user.role === role)
}

/**
 * Get user's role display name
 */
export function getRoleDisplayName(role: string): string {
    const roleNames = {
        'admin': 'Administrator',
        'owner': 'Shop Owner',
        'manager': 'Manager',
        'employee': 'Employee',
        'user': 'User'
    }
    return roleNames[role as UserRole] || 'User'
}
