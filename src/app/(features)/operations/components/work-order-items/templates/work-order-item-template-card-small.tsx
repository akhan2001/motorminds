'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Package, 
    Wrench, 
    Star, 
    DollarSign, 
    Layers,
    Clock,
    Pencil,
    Trash2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'
import { useTemplateActions, useTemplateSelection } from '../../../contexts'

interface WorkOrderItemTemplateCardSmallProps {
    template: WorkOrderItemTemplate
    onSelect?: (template: WorkOrderItemTemplate) => void
    onEdit?: (template: WorkOrderItemTemplate) => void
    onDelete?: (templateId: string) => void
    isSelectable?: boolean
    isSelected?: boolean
    className?: string
}

const getItemTypeIcon = (type: string) => {
    switch (type) {
        case 'labor':
            return <Wrench className="h-3 w-3" />
        case 'part':
            return <Package className="h-3 w-3" />
        case 'service':
            return <Star className="h-3 w-3" />
        case 'fee':
            return <DollarSign className="h-3 w-3" />
        case 'package':
            return <Layers className="h-3 w-3" />
        default:
            return <Package className="h-3 w-3" />
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
            return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
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

export const WorkOrderItemTemplateCardSmall: React.FC<WorkOrderItemTemplateCardSmallProps> = ({
    template,
    onSelect,
    onEdit,
    onDelete,
    isSelectable = true,
    isSelected = false,
    className = ""
}) => {
    const isLabor = template.item_type === 'labor'
    const isPart = template.item_type === 'part'
    
    // Get context-based permissions
    const allowTemplateActions = useTemplateActions()
    const allowTemplateSelection = useTemplateSelection()
    
    // Override props with context values
    const canEdit = allowTemplateActions && !!onEdit
    const canDelete = allowTemplateActions && !!onDelete
    const canSelect = allowTemplateSelection && isSelectable && !!onSelect

    const handleSelect = () => {
        if (canSelect) {
            onSelect(template)
        }
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (canEdit) {
            onEdit(template)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (canDelete && window.confirm('Are you sure you want to delete this template?')) {
            onDelete(template.id)
        }
    }

    return (
        <Card 
            className={`bg-[#1a1a1a] border-[#2a2a2a] transition-colors group ${
                canSelect 
                    ? isSelected 
                        ? 'border-green-500 bg-green-500/5 cursor-pointer' 
                        : 'hover:border-[#3a3a3a] cursor-pointer'
                    : 'hover:border-[#3a3a3a]'
            } ${className}`}
            onClick={canSelect ? handleSelect : undefined}
        >
            <CardContent className="p-3">
                <div className="space-y-2">
                    {/* Header with type badge and actions */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                            <Badge 
                                variant="outline" 
                                className={`${getItemTypeColor(template.item_type)} text-xs font-medium px-1.5 py-0.5`}
                            >
                                <span className="mr-1">
                                    {getItemTypeIcon(template.item_type)}
                                </span>
                                {getItemTypeLabel(template.item_type)}
                            </Badge>
                            {canSelect && isSelected && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20 px-1.5 py-0.5">
                                    ✓
                                </Badge>
                            )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEdit}
                                    className="h-5 w-5 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                                >
                                    <Pencil className="h-2.5 w-2.5" />
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-5 w-5 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Template name */}
                    <h3 className="text-white font-medium text-sm line-clamp-1">
                        {template.name}
                    </h3>

                    {/* Description - only show if short */}
                    {template.description && template.description.length <= 50 && (
                        <p className="text-gray-400 text-xs line-clamp-1">
                            {template.description}
                        </p>
                    )}

                    {/* Part-specific info - compact */}
                    {isPart && template.part_number && (
                        <p className="text-gray-500 text-xs">
                            #{template.part_number}
                        </p>
                    )}

                    {/* Labor hours - compact */}
                    {isLabor && template.labor_hours && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-2.5 w-2.5" />
                            {template.labor_hours}h
                        </div>
                    )}

                    {/* Pricing information - compact */}
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                            {isLabor ? (
                                <span>
                                    {template.quantity} × {formatCurrency(template.unit_price)}/hr
                                </span>
                            ) : (
                                <span>
                                    {template.quantity} × {formatCurrency(template.unit_price)}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-white font-semibold text-sm">
                                {formatCurrency(template.quantity * template.unit_price)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
