'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Package, 
    Wrench, 
    Star, 
    DollarSign, 
    Layers,
    Clock,
    ChevronDown,
    Search
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { useSearchWorkOrderItemTemplates, useWorkOrderItemTemplatesByType } from '../../../hooks/use-work-order-item-templates'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'

interface TemplateDropdownProps {
    shopId: string
    itemType: 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'
    value: string
    onChange: (value: string) => void
    onTemplateSelect: (template: WorkOrderItemTemplate) => void
    placeholder?: string
    disabled?: boolean
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
        case 'discount':
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
        case 'discount':
            return 'bg-red-500/10 text-red-400 border-red-500/20'
        case 'package':
            return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        default:
            return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
}

export const TemplateDropdown: React.FC<TemplateDropdownProps> = ({
    shopId,
    itemType,
    value,
    onChange,
    onTemplateSelect,
    placeholder = "Enter description or search templates...",
    disabled = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(value)
        }, 300)
        return () => clearTimeout(timer)
    }, [value])

    // Get limited templates by type (for showing on focus) - limit to 15 for performance
    const { data: allTemplates = [], isLoading: isLoadingAll } = useWorkOrderItemTemplatesByType(
        shopId,
        itemType,
        { enabled: isOpen && searchTerm.length < 2, limit: 15 }
    )

    // Search templates when user types - limit to 10 for performance
    const { data: searchResults = [], isLoading: isLoadingSearch } = useSearchWorkOrderItemTemplates(
        shopId,
        itemType,
        searchTerm,
        { enabled: searchTerm.length >= 2, limit: 10 }
    )

    // Use search results if user is typing, otherwise show limited templates
    const templates = searchTerm.length >= 2 ? searchResults : allTemplates
    const isLoading = searchTerm.length >= 2 ? isLoadingSearch : isLoadingAll

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)
        // Keep dropdown open if it was already open, or open it if user types
        if (isOpen || newValue.length > 0) {
            setIsOpen(true)
        }
    }

    const handleTemplateClick = (template: WorkOrderItemTemplate) => {
        setIsOpen(false)
        onTemplateSelect(template)
        inputRef.current?.blur()
    }

    const handleInputFocus = () => {
        // Always show dropdown on focus
        setIsOpen(true)
    }

    const showDropdown = isOpen && !disabled && (templates.length > 0 || isLoading)

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                    )}
                    <Search className="h-3 w-3 text-muted-foreground" />
                </div>
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-border dark:border-[#2a2a2a] rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-3 text-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b border-blue-500 mx-auto mb-2"></div>
                            <p className="text-xs text-muted-foreground">Searching templates...</p>
                        </div>
                    ) : templates.length > 0 ? (
                        <div className="py-1">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateClick(template)}
                                    className="w-full px-3 py-2 text-left hover:bg-accent dark:hover:bg-[#2a2a2a] focus:bg-accent dark:focus:bg-[#2a2a2a] focus:outline-none"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge 
                                                    variant="outline" 
                                                    className={`${getItemTypeColor(template.item_type)} text-xs font-medium px-1.5 py-0.5`}
                                                >
                                                    <span className="mr-1">
                                                        {getItemTypeIcon(template.item_type)}
                                                    </span>
                                                    {template.item_type}
                                                </Badge>
                                            </div>
                                            <p className="font-medium text-sm text-foreground dark:text-white truncate">
                                                {template.name}
                                            </p>
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground dark:text-gray-400 truncate mt-0.5">
                                                    {template.description}
                                                </p>
                                            )}
                                            {/* Part-specific fields */}
                                            {template.item_type === 'part' && (
                                                <>
                                                    {template.part_number && (
                                                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                                                            Part #: {template.part_number}
                                                        </p>
                                                    )}
                                                    {template.supplier && (
                                                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                                                            Supplier: {template.supplier}
                                                        </p>
                                                    )}
                                                    {template.warranty_period && (
                                                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                                                            Warranty: {template.warranty_period}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {/* Labor/Service/Package - show labor hours */}
                                            {(template.item_type === 'labor' || template.item_type === 'service' || template.item_type === 'package') && template.labor_hours && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-gray-400 mt-0.5">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {template.labor_hours}h
                                                </div>
                                            )}
                                            {/* Category for all types */}
                                            {template.category && (
                                                <p className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5">
                                                    Category: {template.category}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-semibold text-foreground dark:text-white">
                                                {formatCurrency(template.quantity * template.unit_price)}
                                            </p>
                                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                                                {template.item_type === 'labor' ? (
                                                    `${template.quantity} × ${formatCurrency(template.unit_price)}/hr`
                                                ) : (
                                                    `${template.quantity} × ${formatCurrency(template.unit_price)}`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Show more indicator when there are likely more templates */}
                            {templates.length >= (searchTerm.length >= 2 ? 10 : 15) && (
                                <div className="px-3 py-2 text-center border-t border-border dark:border-[#2a2a2a]">
                                    <p className="text-xs text-muted-foreground dark:text-gray-500">
                                        {searchTerm.length >= 2 
                                            ? "Showing top 10 results. Keep typing to refine search."
                                            : "Showing first 15 templates. Use search to find more."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    )
}
