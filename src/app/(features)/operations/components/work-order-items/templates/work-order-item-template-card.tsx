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

interface WorkOrderItemTemplateCardProps {
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
            return <Wrench className="h-4 w-4" />
        case 'part':
            return <Package className="h-4 w-4" />
        case 'service':
            return <Star className="h-4 w-4" />
        case 'fee':
            return <DollarSign className="h-4 w-4" />
        case 'package':
            return <Layers className="h-4 w-4" />
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

export const WorkOrderItemTemplateCard: React.FC<WorkOrderItemTemplateCardProps> = ({
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

    const handleSelect = () => {
        if (isSelectable && onSelect) {
            onSelect(template)
        }
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onEdit) {
            onEdit(template)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDelete && window.confirm('Are you sure you want to delete this template?')) {
            onDelete(template.id)
        }
    }

    return (
        <Card 
            className={`bg-[#1a1a1a] border-[#2a2a2a] transition-colors group ${
                isSelectable && onSelect 
                    ? isSelected 
                        ? 'border-green-500 bg-green-500/5 cursor-pointer' 
                        : 'hover:border-[#3a3a3a] cursor-pointer'
                    : 'hover:border-[#3a3a3a]'
            } ${className}`}
            onClick={isSelectable && onSelect ? handleSelect : undefined}
        >
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Header with type badge and actions */}
                    <div className="flex items-start justify-between">
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
                            {template.category && (
                                <Badge variant="secondary" className="text-sm bg-[#2a2a2a] text-gray-400">
                                    {template.category}
                                </Badge>
                            )}
                            {isSelectable && onSelect && isSelected && (
                                <Badge variant="outline" className="text-sm bg-green-500/10 text-green-400 border-green-500/20">
                                    ✓ Selected
                                </Badge>
                            )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEdit}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Template name */}
                    <h3 className="text-white font-medium text-base line-clamp-2">
                        {template.name}
                    </h3>

                    {/* Description */}
                    {template.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                            {template.description}
                        </p>
                    )}

                    {/* Part-specific info */}
                    {isPart && template.part_number && (
                        <p className="text-gray-500 text-sm">
                            Part #: {template.part_number}
                        </p>
                    )}

                    {isPart && template.supplier && (
                        <p className="text-gray-500 text-sm">
                            Supplier: {template.supplier}
                        </p>
                    )}

                    {/* Labor hours */}
                    {isLabor && template.labor_hours && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Clock className="h-3 w-3" />
                            {template.labor_hours} hours
                        </div>
                    )}

                    {/* Pricing information */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
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
                            <p className="text-white font-semibold text-base">
                                {formatCurrency(template.quantity * template.unit_price)}
                            </p>
                        </div>
                    </div>

                    {/* Warranty period */}
                    {template.warranty_period && (
                        <p className="text-gray-500 text-sm">
                            Warranty: {template.warranty_period}
                        </p>
                    )}

                </div>
            </CardContent>
        </Card>
    )
}
