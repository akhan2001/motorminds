'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface UserLimitIndicatorProps {
    limit: number
    current: number
    remaining: number
    canCreate: boolean
}

export function UserLimitIndicator({ limit, current, remaining, canCreate }: UserLimitIndicatorProps) {
    const percentage = (current / limit) * 100

    return (
        <Card className={canCreate ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {canCreate ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <span className="font-semibold text-foreground">
                            User Creation Limit
                        </span>
                    </div>
                    <span className={`text-sm font-medium ${canCreate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {remaining} remaining
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{current} of {limit} users created</span>
                        <span>{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${
                                canCreate 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    {!canCreate && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                                You have reached the maximum limit of {limit} users. 
                                Please contact support to increase your limit.
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

