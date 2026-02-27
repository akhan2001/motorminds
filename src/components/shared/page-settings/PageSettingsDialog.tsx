'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface PageSettingsDialogProps {
    title: string
    tooltip?: string
    children: React.ReactNode
    className?: string
}

export const PageSettingsDialog: React.FC<PageSettingsDialogProps> = ({
    title,
    tooltip = 'Page settings',
    children,
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
                        <Settings className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-[#131313] border-border dark:border-[#333333]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground dark:text-white">
                            {title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="pt-2">
                        {children}
                    </div>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    )
}
