'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    MoreVertical, 
    Package, 
    Wrench, 
    Star, 
    DollarSign, 
    Edit, 
    Trash2, 
    Check,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils/currency'
import type { WorkOrderItem } from '../../types/work-order-items'

interface WorkOrderItemCardProps {
    item: WorkOrderItem
    onEdit?: (item: WorkOrderItem) => void
    onDelete?: (itemId: string) => void
    onComplete?: (itemId: string) => void
    onApprove?: (itemId: string) => void
    onReject?: (itemId: string) => void
    isEditable?: boolean
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
        default:
            return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
}

export const WorkOrderItemCard: React.FC<WorkOrderItemCardProps> = ({
    item,
    onEdit,
    onDelete,
    onComplete,
    onApprove,
    onReject,
    isEditable = true,
    className = ""
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isCompleted = !!item.completed_at
    const isApproved = item.active === true
    const isRejected = item.active === false

    return (
        <Card className={`bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                        {/* Type Badge and Title */}
                        <div className="flex items-center gap-2 mb-2">
                            <Badge 
                                variant="outline" 
                                className={`${getItemTypeColor(item.item_type)} text-xs font-medium`}
                            >
                                <span className="mr-1">
                                    {getItemTypeIcon(item.item_type)}
                                </span>
                                {item.item_type.toUpperCase()}
                            </Badge>
                            {isCompleted && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    <Check className="h-3 w-3 mr-1" />
                                    COMPLETED
                                </Badge>
                            )}
                            {isApproved && !isCompleted && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    APPROVED
                                </Badge>
                            )}
                            {isRejected && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    REJECTED
                                </Badge>
                            )}
                        </div>

                        {/* Description */}
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                            {item.description}
                        </h3>

                        {/* Part Number */}
                        {item.part_number && (
                            <p className="text-xs text-gray-400 mb-2">
                                Part #: {item.part_number}
                            </p>
                        )}

                        {/* Quantity/Pricing for non-labor items */}
                        {item.item_type !== 'labor' && (
                            <div className="flex items-center justify-between text-xs mb-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-400">
                                        Qty: <span className="text-white font-medium">{item.quantity}</span>
                                    </span>
                                    <span className="text-gray-400">
                                        @ {formatCurrency(item.unit_price)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Labor Hours and Hourly Rate for labor items */}
                        {item.item_type === 'labor' && (
                            <div className="flex items-center justify-between text-xs mb-2">
                                <div className="flex items-center gap-4">
                                    {item.labor_hours && (
                                        <span className="text-gray-400">
                                            <Clock className="h-3 w-3 inline mr-1" />
                                            {item.labor_hours} hours
                                        </span>
                                    )}
                                    <span className="text-gray-400">
                                        @ {formatCurrency(item.unit_price)}/hr
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Supplier */}
                        {item.supplier && (
                            <p className="text-xs text-gray-400 mb-2">
                                Supplier: {item.supplier}
                            </p>
                        )}

                        {/* Notes */}
                        {item.notes && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                {item.notes}
                            </p>
                        )}
                    </div>

                    {/* Right Content - Price and Actions */}
                    <div className="flex flex-col items-end gap-2">
                        {/* Approve/Reject Buttons */}
                        {isEditable && !isCompleted && (
                            <div className="flex gap-1">
                                {!isApproved && !isRejected && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onApprove?.(item.id)}
                                            className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                            title="Approve item"
                                        >
                                            <CheckCircle className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onReject?.(item.id)}
                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            title="Reject item"
                                        >
                                            <XCircle className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                                {isApproved && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onReject?.(item.id)}
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        title="Reject item"
                                    >
                                        <XCircle className="h-3 w-3" />
                                    </Button>
                                )}
                                {isRejected && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onApprove?.(item.id)}
                                        className="h-6 w-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                        title="Approve item"
                                    >
                                        <CheckCircle className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Total Price */}
                        <div className="text-right">
                            <p className="text-white font-semibold">
                                {formatCurrency(
                                    item.item_type === 'labor' 
                                        ? (item.labor_hours || 0) * (item.unit_price || 0)
                                        : (item.quantity || 0) * (item.unit_price || 0)
                                )}
                            </p>
                        </div>

                        {/* Actions Menu
                        {isEditable && (
                            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                                    {onEdit && (
                                        <DropdownMenuItem 
                                            onClick={() => onEdit(item)}
                                            className="text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {onComplete && !isCompleted && (
                                        <DropdownMenuItem 
                                            onClick={() => onComplete(item.id)}
                                            className="text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Mark Complete
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                                    {onDelete && (
                                        <DropdownMenuItem 
                                            onClick={() => onDelete(item.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )} */}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
