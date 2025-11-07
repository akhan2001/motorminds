'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, Code, Search } from 'lucide-react'
import { getAvailableVariablesList, AVAILABLE_VARIABLES } from '../lib/variable-replacer'
import { cn } from '@/lib/utils'

interface VariableHintsProps {
    textareaId?: string
    onInsert?: (variable: string) => void
    className?: string
    variant?: 'button' | 'inline'
}

export function VariableHints({ 
    textareaId, 
    onInsert,
    className,
    variant = 'button'
}: VariableHintsProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const availableVariables = getAvailableVariablesList()
    
    // Group variables by category
    const groupedVariables = availableVariables.reduce((acc, variable) => {
        const category = variable.path.includes('.') 
            ? variable.path.split('.')[0] 
            : variable.path.startsWith('customer_') || variable.path.startsWith('shop_')
                ? variable.path.split('_')[0]
                : 'other'
        
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(variable)
        return acc
    }, {} as Record<string, typeof availableVariables>)

    // Filter variables based on search query
    const filteredVariables = searchQuery
        ? availableVariables.filter(v => 
            v.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : availableVariables

    const handleInsert = (variable: { path: string; description: string }) => {
        const variableText = `[${variable.path}]`
        
        if (onInsert) {
            onInsert(variableText)
        } else if (textareaId) {
            const textarea = document.getElementById(textareaId) as HTMLTextAreaElement
            if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const text = textarea.value
                const before = text.substring(0, start)
                const after = text.substring(end)
                const newText = `${before}${variableText}${after}`
                
                // Update textarea value
                textarea.value = newText
                
                // Trigger onChange event if it exists
                const event = new Event('input', { bubbles: true })
                textarea.dispatchEvent(event)
                
                // Set cursor position after inserted variable
                setTimeout(() => {
                    textarea.focus()
                    const newPosition = start + variableText.length
                    textarea.setSelectionRange(newPosition, newPosition)
                }, 0)
            }
        }
        
        setOpen(false)
        setSearchQuery('')
    }

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            customer: 'Customer',
            vehicle: 'Vehicle',
            work_order: 'Work Order',
            appointment: 'Appointment',
            shop: 'Shop',
            service: 'Service',
            other: 'Other'
        }
        return labels[category] || category
    }

    if (variant === 'inline') {
        return (
            <div className={cn("flex flex-wrap gap-2", className)}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">
                            <Code className="h-3 w-3 mr-1" />
                            Variables
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                            <CommandInput 
                                placeholder="Search variables..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No variables found.</CommandEmpty>
                                {Object.entries(groupedVariables).map(([category, vars]) => {
                                    const filtered = vars.filter(v => 
                                        !searchQuery || 
                                        v.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        v.description.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    
                                    if (filtered.length === 0) return null
                                    
                                    return (
                                        <CommandGroup key={category} heading={getCategoryLabel(category)}>
                                            {filtered.map((variable) => (
                                                <CommandItem
                                                    key={variable.path}
                                                    value={variable.path}
                                                    onSelect={() => handleInsert(variable)}
                                                    className="flex items-start gap-2 py-2"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-mono text-sm font-medium">
                                                            {variable.path}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {variable.description}
                                                        </div>
                                                    </div>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="max-w-xs">
                                                                <div className="space-y-1">
                                                                    <div className="font-mono text-xs font-medium">
                                                                        [{variable.path}]
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        {variable.description}
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )
                                })}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        )
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Available Variables</span>
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7">
                            <Search className="h-3 w-3 mr-1" />
                            Search Variables
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                        <Command>
                            <CommandInput 
                                placeholder="Search variables..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No variables found.</CommandEmpty>
                                {Object.entries(groupedVariables).map(([category, vars]) => {
                                    const filtered = vars.filter(v => 
                                        !searchQuery || 
                                        v.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        v.description.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    
                                    if (filtered.length === 0) return null
                                    
                                    return (
                                        <CommandGroup key={category} heading={getCategoryLabel(category)}>
                                            {filtered.map((variable) => (
                                                <CommandItem
                                                    key={variable.path}
                                                    value={variable.path}
                                                    onSelect={() => handleInsert(variable)}
                                                    className="flex items-start gap-2 py-2"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-mono text-sm font-medium">
                                                            {variable.path}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {variable.description}
                                                        </div>
                                                    </div>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="right" className="max-w-xs">
                                                                <div className="space-y-1">
                                                                    <div className="font-mono text-xs font-medium">
                                                                        [{variable.path}]
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        {variable.description}
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )
                                })}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {availableVariables.slice(0, 12).map((variable) => (
                    <TooltipProvider key={variable.path}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge
                                    variant="outline"
                                    className="cursor-pointer hover:bg-accent font-mono text-xs"
                                    onClick={() => handleInsert(variable)}
                                >
                                    {variable.path}
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="space-y-1">
                                    <div className="font-mono text-xs font-medium">
                                        [{variable.path}]
                                    </div>
                                    <div className="text-xs">
                                        {variable.description}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
                {availableVariables.length > 12 && (
                    <Badge variant="outline" className="text-xs">
                        +{availableVariables.length - 12} more
                    </Badge>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Click a variable to insert it, or use the search button to find more
            </p>
        </div>
    )
}

