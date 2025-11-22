'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Trash2, Ban, CheckCircle } from 'lucide-react'

interface BulkActionsBarProps {
    selectedCount: number
    onClearSelection: () => void
    actions?: {
        label: string
        icon?: React.ReactNode
        onClick: () => void
        variant?: 'default' | 'destructive' | 'outline'
    }[]
}

export function BulkActionsBar({ 
    selectedCount, 
    onClearSelection,
    actions = []
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null

    return (
        <div className="flex items-center justify-between p-4 bg-muted/50 border rounded-lg">
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                    {selectedCount} selected
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            </div>
            <div className="flex gap-2">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        variant={action.variant || 'default'}
                        size="sm"
                        onClick={action.onClick}
                        className={action.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}

