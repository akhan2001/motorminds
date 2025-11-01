'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
    Package, 
    Wrench, 
    Star, 
    DollarSign, 
    Calculator,
    Trash2,
    X
} from 'lucide-react'
import { TechnicianDropdown } from '@/app/(features)/technician/components/TechnicianDropdown'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils/currency'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'

interface SelectedTemplate extends WorkOrderItemTemplate {
    selectedQuantity?: number
    selectedUnitPrice?: number
    selectedLaborHours?: number
    selectedTechnicianId?: string
}

interface SelectedTemplatesPanelProps {
    selectedTemplates: SelectedTemplate[]
    onRemoveTemplate: (templateId: string) => void
    onUpdateTemplate: (templateId: string, updates: Partial<SelectedTemplate>) => void
    shopId?: string
    className?: string
}

const getItemTypeIcon = (type: string) => {
    switch (type) {
        case 'labor':
            return <Wrench className="h-4 w-4" />
        case 'part':
            return <Package className="h-4 w-4" />
        case 'service':
            return <Star className="h-4 w-4" />
        case 'fee':
            return <DollarSign className="h-4 w-4" />
        case 'package':
            return <Package className="h-4 w-4" />
        default:
            return <Package className="h-4 w-4" />
    }
}

const getItemTypeColor = (type: string) => {
    switch (type) {
        case 'labor':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        case 'part':
            return 'bg-green-500/10 text-green-400 border-green-500/20'
        case 'service':
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        case 'fee':
            return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        case 'package':
            return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        default:
            return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
}

const getItemTypeLabel = (type: string) => {
    switch (type) {
        case 'labor':
            return 'Labor'
        case 'part':
            return 'Part'
        case 'service':
            return 'Service'
        case 'fee':
            return 'Fee'
        case 'package':
            return 'Package'
        default:
            return 'Item'
    }
}

export const SelectedTemplatesPanel: React.FC<SelectedTemplatesPanelProps> = ({
    selectedTemplates,
    onRemoveTemplate,
    onUpdateTemplate,
    shopId,
    className = ""
}) => {
    // Calculate totals by type
    const totals = selectedTemplates.reduce((acc, template) => {
        const quantity = template.selectedQuantity || template.quantity
        const unitPrice = template.selectedUnitPrice || template.unit_price
        const laborHours = template.selectedLaborHours || template.labor_hours || 0
        
        // Calculate total based on item type
        let total = 0
        if (template.item_type === 'labor') {
            // For labor: labor_hours * unit_price
            total = laborHours * unitPrice
        } else {
            // For parts, services, fees: quantity * unit_price
            total = quantity * unitPrice
        }
        
        if (!acc[template.item_type]) {
            acc[template.item_type] = 0
        }
        acc[template.item_type] += total
        
        return acc
    }, {} as Record<string, number>)

    const grandTotal = Object.values(totals).reduce((sum, total) => sum + total, 0)

    const summaryItems = [
        {
            type: 'Labor',
            value: totals.labor || 0,
            icon: Wrench,
            color: 'text-blue-400'
        },
        {
            type: 'Parts',
            value: totals.part || 0,
            icon: Package,
            color: 'text-green-400'
        },
        {
            type: 'Services',
            value: totals.service || 0,
            icon: Star,
            color: 'text-purple-400'
        },
        {
            type: 'Packages',
            value: totals.package || 0,
            icon: Package,
            color: 'text-indigo-400'
        },
        {
            type: 'Fees',
            value: totals.fee || 0,
            icon: DollarSign,
            color: 'text-orange-400'
        },
        {
            type: 'Discounts',
            value: totals.discount || 0,
            icon: DollarSign,
            color: 'text-red-400'
        }
    ].filter(item => item.value > 0)

    return (
        <div className={`w-full bg-slate-50 dark:bg-[#131313] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-border dark:border-[#222222] flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-foreground dark:text-white font-medium text-base">Selected Items</h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">
                            {selectedTemplates.length} item{selectedTemplates.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area - Scrollable */}
            <ScrollArea className="max-h-96 min-h-0">
                <div className="p-4 space-y-4">
                    {/* Selected Templates List */}
                    {selectedTemplates.length > 0 ? (
                        <div className="space-y-3">
                            {selectedTemplates.map((template) => {
                                const quantity = template.selectedQuantity || template.quantity
                                const unitPrice = template.selectedUnitPrice || template.unit_price
                                const laborHours = template.selectedLaborHours || template.labor_hours || 0
                                const isLabor = template.item_type === 'labor'
                                
                                // Calculate total based on item type
                                const total = isLabor 
                                    ? laborHours * unitPrice  // For labor: labor_hours * unit_price
                                    : quantity * unitPrice    // For parts, services, fees: quantity * unit_price

                                return (
                                    <Card key={template.id} className="bg-white dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                                        <CardContent className="p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`${getItemTypeColor(template.item_type)} text-sm font-medium`}
                                                    >
                                                        <span className="mr-1">
                                                            {getItemTypeIcon(template.item_type)}
                                                        </span>
                                                        {getItemTypeLabel(template.item_type)}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onRemoveTemplate(template.id)}
                                                    className="h-6 w-6 p-0 text-muted-foreground dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <h4 className="text-foreground dark:text-white font-medium text-base mb-1">
                                                {template.name}
                                            </h4>

                                            {template.description && (
                                                <p className="text-muted-foreground dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                                    {template.description}
                                                </p>
                                            )}

                                            {/* Item-specific details */}
                                            {template.part_number && (
                                                <p className="text-muted-foreground dark:text-gray-500 text-sm">
                                                    Part: {template.part_number}
                                                </p>
                                            )}

                                            {template.supplier && (
                                                <p className="text-muted-foreground dark:text-gray-500 text-sm">
                                                    Supplier: {template.supplier}
                                                </p>
                                            )}

                                            {/* Editable Fields */}
                                            <div className="mt-3 space-y-2">
                                                {/* Quantity (for non-labor items) */}
                                                {!isLabor && (
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground dark:text-gray-400 mb-1 block">
                                                            Quantity
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={template.selectedQuantity || template.quantity}
                                                            onChange={(e) => 
                                                                onUpdateTemplate(template.id, { 
                                                                    selectedQuantity: parseFloat(e.target.value) || 0 
                                                                })
                                                            }
                                                            className="h-8 text-sm bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                                        />
                                                    </div>
                                                )}

                                                {/* Labor Hours (for labor items) */}
                                                {isLabor && (
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground dark:text-gray-400 mb-1 block">
                                                            Labor Hours
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={template.selectedLaborHours || template.labor_hours || ''}
                                                            onChange={(e) => 
                                                                onUpdateTemplate(template.id, { 
                                                                    selectedLaborHours: parseFloat(e.target.value) || 0 
                                                                })
                                                            }
                                                            className="h-8 text-sm bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                                        />
                                                    </div>
                                                )}

                                                {/* Unit Price */}
                                                <div>
                                                    <Label className="text-xs text-muted-foreground dark:text-gray-400 mb-1 block">
                                                        {isLabor ? 'Hourly Rate' : 'Unit Price'}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={template.selectedUnitPrice || template.unit_price}
                                                        onChange={(e) => 
                                                            onUpdateTemplate(template.id, { 
                                                                selectedUnitPrice: parseFloat(e.target.value) || 0 
                                                            })
                                                        }
                                                        className="h-8 text-sm bg-background dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] text-foreground dark:text-white"
                                                    />
                                                </div>

                                                {/* Technician Selection (for labor items) */}
                                                {isLabor && shopId && (
                                                    <div>
                                                        <Label className="text-xs text-muted-foreground dark:text-gray-400 mb-1 block">
                                                            Technician
                                                        </Label>
                                                        <TechnicianDropdown
                                                            shopId={shopId}
                                                            selectedTechnicianId={template.selectedTechnicianId || ''}
                                                            onTechnicianSelect={(technicianId) => 
                                                                onUpdateTemplate(template.id, { 
                                                                    selectedTechnicianId: technicianId === 'none' ? '' : technicianId 
                                                                })
                                                            }
                                                            placeholder="Select technician..."
                                                            className="w-full"
                                                            showNoneOption={true}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pricing Information */}
                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border dark:border-[#2a2a2a]">
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                                                    {isLabor ? (
                                                        <span>
                                                            {quantity} hrs × {formatCurrency(unitPrice)}/hr
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {quantity} × {formatCurrency(unitPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-foreground dark:text-white font-medium text-base">
                                                    {formatCurrency(total)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="h-8 w-8 text-muted-foreground dark:text-gray-500 mx-auto mb-2" />
                            <p className="text-muted-foreground dark:text-gray-500 text-base">No items selected</p>
                            <p className="text-muted-foreground dark:text-gray-600 text-sm mt-1">
                                Select templates from the right panel to add them here
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Cost Summary Footer */}
            {selectedTemplates.length > 0 && (
                <div className="p-4 border-t border-border dark:border-[#222222] flex-shrink-0">
                    <div className="space-y-3">
                        {/* Individual totals */}
                        {summaryItems.map((item) => {
                            const IconComponent = item.icon
                            return (
                                <div key={item.type} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <IconComponent className={`h-3 w-3 ${item.color}`} />
                                        <span className="text-sm text-muted-foreground dark:text-gray-400">{item.type}</span>
                                    </div>
                                    <span className="text-sm text-foreground dark:text-gray-300 font-medium">
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            )
                        })}

                        {/* Separator */}
                        <hr className="border-border dark:border-[#2a2a2a]" />

                        {/* Grand Total */}
                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-foreground dark:text-white">Total</span>
                            <span className="text-lg font-semibold text-green-500 dark:text-green-400">
                                {formatCurrency(grandTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
