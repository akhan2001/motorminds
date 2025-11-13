'use client'

import React from 'react'
import { Check, FileText, ChevronDown } from 'lucide-react'
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
import { useShopInfo } from '@/hooks/core/useShopInfo'
import { useAuth } from '../../../operations/hooks/use-auth'

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
    const { shopId } = useAuth()
    const templates = getAvailableTemplates(shopId)
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
    
    // If selected template is not available (e.g., user switched shops), reset to professional
    // Only reset if we have templates loaded and the selected one is not in the list
    React.useEffect(() => {
        if (templates.length > 0 && selectedTemplateId && !selectedTemplate) {
            // Only reset if the selected template is truly not available
            const isAvailable = templates.some(t => t.id === selectedTemplateId)
            if (!isAvailable) {
                onTemplateChange('professional')
            }
        }
    }, [selectedTemplateId, templates.length, selectedTemplate, onTemplateChange])
    
    // Handle template selection
    const handleTemplateSelect = React.useCallback((templateId: TemplateId) => {
        onTemplateChange(templateId)
    }, [onTemplateChange])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className || "gap-2"}>
                    <FileText className="h-4 w-4" />
                    {selectedTemplate?.name || 'Select Template'}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                <DropdownMenuLabel className="text-muted-foreground dark:text-gray-400">Templates</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border dark:bg-[#2a2a2a]" />
                {templates.map((template) => (
                    <DropdownMenuItem
                        key={template.id}
                        onSelect={() => {
                            handleTemplateSelect(template.id as TemplateId)
                        }}
                        className="cursor-pointer hover:bg-accent dark:hover:bg-[#2a2a2a] text-foreground dark:text-white"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-muted-foreground dark:text-gray-400">{template.description}</span>
                            </div>
                            {selectedTemplateId === template.id && (
                                <Check className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

