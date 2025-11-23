'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconColor?: string
    iconBg?: string
    loading?: boolean
    trend?: {
        value: number
        label: string
        isPositive: boolean
    }
}

export function StatsCard({ 
    title, 
    value, 
    icon: Icon, 
    iconColor = 'text-blue-600 dark:text-blue-400',
    iconBg = 'bg-blue-100 dark:bg-blue-900/20',
    loading = false,
    trend 
}: StatsCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold text-foreground">
                            {loading ? '...' : value}
                        </p>
                        {trend && (
                            <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                            </p>
                        )}
                    </div>
                    <div className={`p-3 ${iconBg} rounded-full`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

