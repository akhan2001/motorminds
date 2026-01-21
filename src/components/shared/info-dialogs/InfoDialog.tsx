'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { InfoContent } from './types'

interface InfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    content: InfoContent
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    content,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#131313] border-border dark:border-[#333333]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-foreground dark:text-white">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-muted-foreground dark:text-gray-400">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {content.sections.map((section, index) => (
                        <div key={index} className="space-y-3">
                            <h3 className="text-lg font-semibold text-foreground dark:text-white flex items-center gap-2">
                                {section.icon && <section.icon className="h-5 w-5" />}
                                {section.title}
                            </h3>
                            {section.description && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    {section.description}
                                </p>
                            )}
                            {section.items && (
                                <ul className="space-y-2 ml-6">
                                    {section.items.map((item, itemIndex) => (
                                        <li
                                            key={itemIndex}
                                            className="text-sm text-foreground dark:text-gray-300 list-disc"
                                        >
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {section.steps && (
                                <ol className="space-y-2 ml-6">
                                    {section.steps.map((step, stepIndex) => (
                                        <li
                                            key={stepIndex}
                                            className="text-sm text-foreground dark:text-gray-300 list-decimal"
                                        >
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
