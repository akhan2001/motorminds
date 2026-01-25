'use client'

import { useEmailStats } from '../../hooks/use-email-history'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Calendar, CalendarDays, BarChart3, CheckCircle2, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function EmailStats() {
    const { data, isLoading, error } = useEmailStats()

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-20" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error || !data?.stats) {
        return (
            <Card className="mb-6 border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                    <p className="text-sm text-destructive">
                        {error?.message || 'Unable to load email statistics'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const stats = data.stats

    const statCards = [
        {
            label: 'Total Sent',
            value: stats.total,
            icon: Mail,
            color: 'text-blue-500'
        },
        {
            label: 'Today',
            value: stats.today,
            icon: Calendar,
            color: 'text-green-500'
        },
        {
            label: 'This Week',
            value: stats.thisWeek,
            icon: CalendarDays,
            color: 'text-purple-500'
        },
        {
            label: 'This Month',
            value: stats.thisMonth,
            icon: BarChart3,
            color: 'text-orange-500'
        },
        {
            label: 'Delivered',
            value: stats.sent,
            icon: CheckCircle2,
            color: 'text-emerald-500'
        },
        {
            label: 'Failed',
            value: stats.failed,
            icon: XCircle,
            color: 'text-red-500'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {statCards.map((stat) => (
                <Card key={stat.label} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            {stat.label}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
