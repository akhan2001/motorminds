'use client'

import { Badge } from '@/components/ui/badge'

interface RoleBadgeProps {
    role: string
    variant?: 'default' | 'outline'
}

export function RoleBadge({ role, variant = 'outline' }: RoleBadgeProps) {
    const getRoleColor = (role: string) => {
        const roleLower = role.toLowerCase()
        switch (roleLower) {
            case 'admin':
            case 'super-admin':
            case 'super_admin':
                return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
            case 'shop_owner':
            case 'shop owner':
                return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
            case 'mechanic':
                return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
            case 'customer':
            case 'user':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
        }
    }

    const formatRole = (role: string) => {
        return role
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    return (
        <Badge variant={variant} className={getRoleColor(role)}>
            {formatRole(role)}
        </Badge>
    )
}

