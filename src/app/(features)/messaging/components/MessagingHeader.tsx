'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface MessagingHeaderProps {
    title: string
    description: string
    onAction?: () => void
    actionLabel?: string
}

export function MessagingHeader({ 
    title, 
    description, 
    onAction, 
    actionLabel 
}: MessagingHeaderProps) {
    return (
        <div className="border-b border-border dark:border-[#2a2a2a] bg-background dark:bg-[#0a0a0a]">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground dark:text-white">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                            {description}
                        </p>
                    </div>
                    {onAction && actionLabel && (
                        <Button onClick={onAction} size="default">
                            <Plus className="h-4 w-4 mr-2" />
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

