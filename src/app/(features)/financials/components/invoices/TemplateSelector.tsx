'use client'

import React from 'react'
import { Check, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getAvailableTemplates } from '../../lib/pdf/template-registry'
import type { TemplateId } from '../../types/invoice-pdf'

interface TemplateSelectorProps {
    selectedTemplateId: TemplateId
    onTemplateChange: (templateId: TemplateId) => void
    variant?: 'default' | 'ghost' | 'outline'
    size?: 'default' | 'sm' | 'lg'
    className?: string
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    selectedTemplateId,
    onTemplateChange,
    variant = 'outline',
    size = 'sm',
    className,
}) => {
    const templates = getAvailableTemplates()
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className || "gap-2"}>
                    <FileText className="h-4 w-4" />
                    {selectedTemplate?.name || 'Select Template'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-[#2a2a2a]">
                <DropdownMenuLabel className="text-gray-400">PDF Template</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                {templates.map((template) => (
                    <DropdownMenuItem
                        key={template.id}
                        onClick={() => onTemplateChange(template.id as TemplateId)}
                        className="cursor-pointer hover:bg-[#2a2a2a] text-white"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-gray-400">{template.description}</span>
                            </div>
                            {selectedTemplateId === template.id && (
                                <Check className="h-4 w-4 text-blue-400" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

