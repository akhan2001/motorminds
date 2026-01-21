'use client'

import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoDialog } from './InfoDialog'
import { InfoContent } from './types'

interface InfoDialogButtonProps {
    title: string
    description?: string
    content: InfoContent
    tooltip?: string
    className?: string
}

export const InfoDialogButton: React.FC<InfoDialogButtonProps> = ({
    title,
    description,
    content,
    tooltip = 'Learn more',
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className={`bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground w-9 h-9 ${className || ''}`}
                        onClick={() => setIsOpen(true)}
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
            <InfoDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                title={title}
                description={description}
                content={content}
            />
        </TooltipProvider>
    )
}
