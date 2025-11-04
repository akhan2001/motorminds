'use client'

import React from 'react'
import { AlertTriangle, AlertCircle, Info, Shield, Wrench, DollarSign, Clock } from 'lucide-react'
import { InsightFlag } from '../types/mia-insights'

interface InsightFlagsProps {
    flags: InsightFlag[]
}

const getFlagIcon = (type: string) => {
    switch (type) {
        case 'urgent':
            return <AlertTriangle className="h-4 w-4 text-red-400" />
        case 'warning':
            return <AlertCircle className="h-4 w-4 text-yellow-400" />
        case 'info':
        default:
            return <Info className="h-4 w-4 text-blue-400" />
    }
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'safety':
            return <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
        case 'maintenance':
            return <Wrench className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        case 'cost':
            return <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400" />
        case 'timing':
            return <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
        default:
            return <Info className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
    }
}

const getFlagStyles = (type: string) => {
    switch (type) {
        case 'urgent':
            return 'bg-red-900/20 dark:bg-red-900/20 border-red-500/30 dark:border-red-500/30 text-red-600 dark:text-red-400'
        case 'warning':
            return 'bg-yellow-900/20 dark:bg-yellow-900/20 border-yellow-500/30 dark:border-yellow-500/30 text-yellow-600 dark:text-yellow-300'
        case 'info':
        default:
            return 'bg-blue-900/20 dark:bg-blue-900/20 border-blue-500/30 dark:border-blue-500/30 text-blue-600 dark:text-blue-300'
    }
}

export const InsightFlags: React.FC<InsightFlagsProps> = ({ flags }) => {
    if (!flags || flags.length === 0) return null

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                <span>Important Flags</span>
            </h4>
            <div className="space-y-2">
                {flags.map((flag, index) => (
                    <div 
                        key={index} 
                        className={`border rounded-lg p-3 ${getFlagStyles(flag.type)}`}
                    >
                        <div className="flex items-start space-x-2">
                            {/* {getFlagIcon(flag.type)} */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                    {getCategoryIcon(flag.category)}
                                    <span className="text-xs font-medium capitalize">
                                        {flag.category}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed">{flag.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
