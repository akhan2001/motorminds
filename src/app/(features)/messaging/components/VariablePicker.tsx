'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AVAILABLE_VARIABLES } from '../types/message-template'
import { Code2, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface VariablePickerProps {
    onInsert: (variable: string) => void
}

export function VariablePicker({ onInsert }: VariablePickerProps) {
    const [copiedVar, setCopiedVar] = useState<string | null>(null)

    const handleInsert = (varName: string) => {
        const formattedVar = `{{${varName}}}`
        onInsert(formattedVar)
        
        // Copy to clipboard
        navigator.clipboard.writeText(formattedVar)
        setCopiedVar(varName)
        setTimeout(() => setCopiedVar(null), 2000)
    }

    const variableGroups = [
        {
            title: 'Customer',
            variables: AVAILABLE_VARIABLES.filter(v => 
                v.name.includes('customer_name')
            )
        },
        {
            title: 'Vehicle',
            variables: AVAILABLE_VARIABLES.filter(v => 
                v.name.includes('vehicle_')
            )
        },
        {
            title: 'Shop',
            variables: AVAILABLE_VARIABLES.filter(v => 
                v.name.includes('shop_')
            )
        },
        {
            title: 'Service',
            variables: AVAILABLE_VARIABLES.filter(v => 
                v.name.includes('work_order_') || v.name.includes('service_') || v.name.includes('delay_')
            )
        }
    ]

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                    <Code2 className="h-4 w-4 mr-2" />
                    Insert Variable
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="start">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium text-sm mb-1">Available Variables</h4>
                        <p className="text-xs text-muted-foreground">
                            Click to insert into your message template
                        </p>
                    </div>

                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {variableGroups.map((group) => (
                                group.variables.length > 0 && (
                                    <div key={group.title} className="space-y-2">
                                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            {group.title}
                                        </h5>
                                        <div className="space-y-1">
                                            {group.variables.map((variable) => (
                                                <button
                                                    key={variable.name}
                                                    type="button"
                                                    onClick={() => handleInsert(variable.name)}
                                                    className="w-full flex items-start justify-between gap-2 p-2 rounded hover:bg-accent text-left group"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                                {`{{${variable.name}}}`}
                                                            </code>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {variable.description}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                                                            Example: {variable.example}
                                                        </p>
                                                    </div>
                                                    {copiedVar === variable.name ? (
                                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground">
                            <strong>Tip:</strong> Variables are replaced with actual data when the message is sent.
                            Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{`{{variable_name}}`}</code> format.
                        </p>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

