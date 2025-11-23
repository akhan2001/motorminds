'use client'

import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
    status: string
    variant?: 'default' | 'outline'
}

export function StatusBadge({ status, variant = 'outline' }: StatusBadgeProps) {
    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase()
        switch (statusLower) {
            case 'active':
                return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
            case 'inactive':
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            case 'suspended':
                return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
            case 'pending':
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
        }
    }

    const formatStatus = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    }

    return (
        <Badge variant={variant} className={getStatusColor(status)}>
            {formatStatus(status)}
        </Badge>
    )
}

