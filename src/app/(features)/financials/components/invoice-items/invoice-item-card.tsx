'use client'

import React, { useState } from 'react'
import {
    Wrench,
    Package,
    Briefcase,
    DollarSign,
    Trash2,
    Edit2,
    Copy,
    RotateCcw,
    Clock,
    User,
    AlertCircle,
    Tag,
    Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InvoiceItem, InvoiceItemType } from '../../types/invoice-items'

interface InvoiceItemCardProps {
    item: InvoiceItem
    onEdit?: (item: InvoiceItem) => void
    onDelete?: (itemId: string) => void
    onDuplicate?: (itemId: string) => void
    onRestore?: (itemId: string) => void
    isEditable?: boolean
    className?: string
}

const getItemTypeIcon = (type: InvoiceItemType) => {
    switch (type) {
        case 'labor':
            return <Wrench className="h-4 w-4" />
        case 'part':
            return <Package className="h-4 w-4" />
        case 'service':
            return <Briefcase className="h-4 w-4" />
        case 'fee':
            return <DollarSign className="h-4 w-4" />
        case 'discount':
            return <Tag className="h-4 w-4" />
        case 'package':
            return <Layers className="h-4 w-4" />
        default:
            return <Package className="h-4 w-4" />
    }
}

const getItemTypeBadgeColor = (type: InvoiceItemType) => {
    switch (type) {
        case 'labor':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        case 'part':
            return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'service':
            return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        case 'fee':
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'discount':
            return 'bg-red-500/20 text-red-400 border-red-500/30'
        case 'package':
            return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
        default:
            return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount)
}

export const InvoiceItemCard: React.FC<InvoiceItemCardProps> = ({
    item,
    onEdit,
    onDelete,
    onDuplicate,
    onRestore,
    isEditable = true,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false)

    const handleEdit = () => {
        if (onEdit && isEditable) {
            onEdit(item)
        }
    }

    const handleDelete = () => {
        if (onDelete && isEditable) {
            onDelete(item.id)
        }
    }

    const handleDuplicate = () => {
        if (onDuplicate) {
            onDuplicate(item.id)
        }
    }

    const handleRestore = () => {
        if (onRestore && item.is_from_work_order) {
            onRestore(item.id)
        }
    }

    const showModifiedBadge = item.is_from_work_order && item.is_modified
    const showFromWorkOrderBadge = item.is_from_work_order && !item.is_modified

    return (
        <Card
            className={cn(
                'bg-[#1a1a1a] border-[#2a2a2a] p-4 transition-all duration-200',
                isHovered && isEditable && 'border-[#3a3a3a] bg-[#1f1f1f]',
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Item Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                            'p-1.5 rounded-md',
                            getItemTypeBadgeColor(item.item_type).replace('text-', 'bg-').replace('/20', '/10')
                        )}>
                            {getItemTypeIcon(item.item_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">
                                {item.description}
                            </h4>
                            {item.part_number && (
                                <p className="text-xs text-gray-400">PN: {item.part_number}</p>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge
                            variant="outline"
                            className={cn('text-xs', getItemTypeBadgeColor(item.item_type))}
                        >
                            {item.item_type.toUpperCase()}
                        </Badge>
                        {showFromWorkOrderBadge && (
                            <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                From Work Order
                            </Badge>
                        )}
                        {showModifiedBadge && (
                            <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Modified
                            </Badge>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        {item.item_type === 'labor' && item.labor_hours && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{item.labor_hours} hours</span>
                            </div>
                        )}
                        {item.supplier && (
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{item.supplier}</span>
                            </div>
                        )}
                        {item.category && (
                            <div className="col-span-2">
                                <span className="text-gray-500">Category:</span> {item.category}
                            </div>
                        )}
                        {item.warranty_period && (
                            <div className="col-span-2">
                                <span className="text-gray-500">Warranty:</span> {item.warranty_period}
                            </div>
                        )}
                        {item.invoice_specific_notes && (
                            <div className="col-span-2 text-gray-500 italic">
                                Note: {item.invoice_specific_notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 mb-1">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                            {item.item_type === 'labor' && '/hr'}
                        </div>
                        <div className="text-lg font-semibold text-white">
                            {formatCurrency(item.total_price)}
                        </div>
                        {item.invoice_specific_discount && item.invoice_specific_discount > 0 && (
                            <div className="text-xs text-green-400">
                                -{formatCurrency(item.invoice_specific_discount)} discount
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {isEditable && (isHovered || true) && (
                        <div className="flex items-center gap-1">
                            {item.is_from_work_order && item.is_modified && onRestore && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRestore}
                                    className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    title="Restore to original"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {onDuplicate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDuplicate}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                                    title="Duplicate"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEdit}
                                    className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                    title="Edit"
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    title="Delete"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

export default InvoiceItemCard

