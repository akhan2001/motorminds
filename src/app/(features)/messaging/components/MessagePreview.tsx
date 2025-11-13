'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Eye, Info } from 'lucide-react'
import { replaceVariables, extractVariables } from '../lib/variable-replacer'
import { cn } from '@/lib/utils'

interface MessagePreviewProps {
    template: string
    sampleData?: Record<string, any>
    className?: string
    showTitle?: boolean
    showVariables?: boolean
    compact?: boolean
}

// Default sample data
const DEFAULT_SAMPLE_DATA = {
    customer: {
        customer_name: 'John Doe',
        customer_phone: '+1234567890',
        customer_email: 'john@example.com',
        customer_address: '123 Main St'
    },
    vehicle: {
        year: '2020',
        make: 'Toyota',
        model: 'Camry',
        license_plate: 'ABC-123',
        vin: '1HGBH41JXMN109186',
        mileage: '45000',
        color: 'Blue'
    },
    work_order: {
        work_order_number: 'WO-1234',
        title: 'Oil Change',
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_amount: 89.99
    },
    appointment: {
        appointment_date: 'Monday, January 15, 2024',
        appointment_time: '10:00 AM',
        start_time: '10:00',
        service_type: 'Oil Change',
        confirmation_code: 'ABC123'
    },
    shop: {
        shop_name: 'Auto Shop',
        shop_phone: '+1987654321',
        shop_address: '456 Business Ave',
        shop_email: 'info@autoshop.com'
    },
    service: {
        service_type: 'Oil Change',
        service_date: new Date().toISOString(),
        service_amount: 89.99
    }
}

export function MessagePreview({
    template,
    sampleData,
    className,
    showTitle = true,
    showVariables = true,
    compact = false
}: MessagePreviewProps) {
    if (!template || !template.trim()) {
        return null
    }

    const data = { ...DEFAULT_SAMPLE_DATA, ...sampleData }
    const previewMessage = replaceVariables(template, data, {
        missingVariableBehavior: 'placeholder'
    })
    
    const variables = extractVariables(template)
    const usedVariables = variables.filter(v => {
        // Check if variable exists in sample data
        const parts = v.split('.')
        if (parts.length === 1) {
            // Direct variable (customer_name, shop_name, etc.)
            return data.customer?.[v] !== undefined || 
                   data.shop?.[v] !== undefined ||
                   data[v] !== undefined
        } else {
            // Nested variable (vehicle.make, work_order.total_amount, etc.)
            const [category, ...rest] = parts
            let value = data[category]
            for (const key of rest) {
                value = value?.[key]
            }
            return value !== undefined
        }
    })
    
    const missingVariables = variables.filter(v => !usedVariables.includes(v))

    if (compact) {
        return (
            <div className={cn("space-y-2", className)}>
                <div className="bg-muted p-3 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
                </div>
                {showVariables && variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-xs">
                        <span className="text-muted-foreground">Variables:</span>
                        {variables.map(v => (
                            <Badge 
                                key={v} 
                                variant={missingVariables.includes(v) ? "destructive" : "outline"}
                                className="text-xs"
                            >
                                {v}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        {showTitle && (
                            <>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Message Preview
                                </CardTitle>
                                <CardDescription>
                                    How the message will look with sample data
                                </CardDescription>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Preview Message */}
                <div className="bg-muted p-4 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {previewMessage}
                    </p>
                </div>

                {/* Variables Info */}
                {showVariables && variables.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Variables Used
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <TooltipProvider>
                                {variables.map(v => (
                                    <Tooltip key={v}>
                                        <TooltipTrigger asChild>
                                            <Badge 
                                                variant={missingVariables.includes(v) ? "destructive" : "default"}
                                                className="cursor-help"
                                            >
                                                {v}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {missingVariables.includes(v) ? (
                                                <p className="text-xs">
                                                    This variable may not be available in the actual data
                                                </p>
                                            ) : (
                                                <p className="text-xs">
                                                    Variable will be replaced with actual data
                                                </p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </div>
                        {missingVariables.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ {missingVariables.length} variable(s) may not be available in actual data
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

