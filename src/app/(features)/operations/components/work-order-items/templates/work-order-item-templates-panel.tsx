'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, Package, Loader2 } from 'lucide-react'
import { WorkOrderItemTemplateCard } from './work-order-item-template-card'
import { WorkOrderItemTemplateCardSmall } from './work-order-item-template-card-small'
import { useInfiniteWorkOrderItemTemplates, useDeleteWorkOrderItemTemplate } from '../../../hooks/use-work-order-item-templates'
import { useCloneTemplateToWorkOrder } from '../../../hooks/use-work-order-item-templates'
import { getTemplateCategories } from './Categories/template-categories'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'
import { usePanelContext } from '../../../contexts'

interface WorkOrderItemTemplatesPanelProps {
    shopId: string
    workOrderId?: string
    technicianId?: string
    onTemplateSelected?: (template: WorkOrderItemTemplate) => void
    selectedTemplateIds?: string[]
    onCreateTemplate?: () => void // Callback for create action
    onEditTemplate?: (template: WorkOrderItemTemplate) => void // Callback for edit action
    className?: string
}

export const WorkOrderItemTemplatesPanel: React.FC<WorkOrderItemTemplatesPanelProps> = ({
    shopId,
    workOrderId,
    technicianId,
    onTemplateSelected,
    selectedTemplateIds = [],
    onCreateTemplate,
    onEditTemplate,
    className = ""
}) => {
    const [searchInput, setSearchInput] = useState('') // User's input (immediate)
    const [searchTerm, setSearchTerm] = useState('') // Debounced search term (delayed)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedItemType, setSelectedItemType] = useState<string>('all')
    
    // Get panel context to determine card size
    const { context } = usePanelContext()
    const useSmallCard = context === 'work-order-modal' || context === 'work-order-edit'

    // Debounce search input - wait 500ms after user stops typing (longer for server-side search)
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchInput])

    // Use infinite query for better performance with large datasets
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteWorkOrderItemTemplates(shopId, {
        enabled: true,
        limit: 20, // Load 20 templates per page
        search: searchTerm.length >= 2 ? searchTerm : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        itemType: selectedItemType !== 'all' ? selectedItemType : undefined
    })

    const deleteTemplateMutation = useDeleteWorkOrderItemTemplate()
    const cloneTemplateMutation = useCloneTemplateToWorkOrder()
    
    // Get predefined categories
    const categories = getTemplateCategories().map(cat => cat.value)

    // Define item types for filtering
    const itemTypes = [
        { value: 'all', label: 'All Types' },
        { value: 'labor', label: 'Labor' },
        { value: 'part', label: 'Parts' },
        { value: 'service', label: 'Services' },
        { value: 'fee', label: 'Fees' },
        { value: 'discount', label: 'Discounts' },
        { value: 'package', label: 'Packages' }
    ]

    // Flatten infinite query results
    const allTemplates = useMemo(() => {
        return data?.pages?.flatMap(page => page.templates) || []
    }, [data])

    // For display purposes, we'll use the flattened templates
    const filteredTemplates = allTemplates


    const handleTemplateSelect = async (template: WorkOrderItemTemplate) => {
        if (workOrderId && workOrderId !== "new") {
            // Clone template to existing work order
            try {
                await cloneTemplateMutation.mutateAsync({
                    template_id: template.id,
                    work_order_id: workOrderId,
                    technician_id: technicianId
                })
            } catch (error) {
                console.error('Failed to clone template:', error)
            }
        } else {
            // For new work orders, call the callback to add to selected templates
            onTemplateSelected?.(template)
        }
    }

    const handleEditTemplateClick = (template: WorkOrderItemTemplate) => {
        // Use callback if provided, otherwise do nothing
        onEditTemplate?.(template)
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteTemplateMutation.mutateAsync(templateId)
        } catch (error) {
            console.error('Failed to delete template:', error)
        }
    }

    const handleCreateTemplateClick = () => {
        // Use callback if provided, otherwise do nothing
        onCreateTemplate?.()
    }

    // Infinite scroll handler
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        
        // Load more when user scrolls to bottom 200px
        if (scrollHeight - scrollTop <= clientHeight + 200 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    if (isLoading) {
        return (
            <div className={`w-full bg-slate-50 dark:bg-[#131313] border-l border-border dark:border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-border dark:border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-foreground dark:text-white font-medium text-sm">Templates</h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-xs mt-1">Reusable work order items</p>
                    </div>
                </div>

                {/* Loading State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-muted-foreground dark:text-gray-400 text-base">Loading templates...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`w-full bg-slate-50 dark:bg-[#131313] border-l border-border dark:border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-border dark:border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-foreground dark:text-white font-medium text-sm">Templates</h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-xs mt-1">Reusable work order items</p>
                    </div>
                </div>

                {/* Error State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Package className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
                        <p className="text-red-500 dark:text-red-400 text-base">Failed to load templates</p>
                        <p className="text-muted-foreground dark:text-gray-500 text-sm mt-1">{error.message}</p>
                    </div>
                </div>
            </div>
        )
    }

    // Don't show header in modal context (modal already has header)
    const showHeader = context !== 'templates-page'

    return (
        <div className={`w-full bg-slate-50 dark:bg-[#131313] ${showHeader ? 'border-l border-border dark:border-[#222222]' : ''} flex flex-col h-full min-h-0 ${className}`}>
            {/* Header - only show in work order contexts */}
            {showHeader && (
                <div className="p-4 border-b border-border dark:border-[#222222] flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-foreground dark:text-white font-medium text-base">Templates</h3>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm mt-1">Reusable work order items</p>
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCreateTemplateClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            New
                        </Button>
                    </div>
                </div>
            )}

            {/* Search and Filter - always show */}
            <div className="p-4 border-b border-border dark:border-[#222222] flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground dark:text-gray-400" />
                        <Input
                            placeholder="Search templates..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 bg-background dark:bg-[#292929] text-foreground dark:text-white border-border dark:border-[#626262] text-sm"
                        />
                        {searchInput !== searchTerm && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground dark:border-gray-400"></div>
                            </div>
                        )}
                    </div>
                    {!showHeader && (
                        <Button
                            size="sm"
                            onClick={handleCreateTemplateClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New
                        </Button>
                    )}
                </div>
                
                {/* Filter Controls */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                            <SelectTrigger className="bg-background dark:bg-[#292929] text-foreground dark:text-white border-border dark:border-[#626262] text-sm h-8">
                                <Filter className="h-3 w-3 mr-2" />
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover dark:bg-[#292929] text-popover-foreground dark:text-white border-border dark:border-[#626262]">
                                {itemTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="bg-background dark:bg-[#292929] text-foreground dark:text-white border-border dark:border-[#626262] text-sm h-8">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover dark:bg-[#292929] text-popover-foreground dark:text-white border-border dark:border-[#626262]">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Content Area - Scrollable with Infinite Scroll */}
            <div 
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800"
                onScroll={handleScroll}
            >
                <div className={`p-4 ${useSmallCard ? 'space-y-2' : 'space-y-3'}`}>
                    {isLoading && filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                            <p className="text-muted-foreground dark:text-gray-400 text-sm">Loading templates...</p>
                        </div>
                    ) : filteredTemplates.length > 0 ? (
                        <>
                            {filteredTemplates.map((template) => {
                                const CardComponent = useSmallCard ? WorkOrderItemTemplateCardSmall : WorkOrderItemTemplateCard
                                return (
                                    <CardComponent
                                        key={template.id}
                                        template={template}
                                        onSelect={workOrderId ? handleTemplateSelect : undefined}
                                        onEdit={handleEditTemplateClick}
                                        onDelete={handleDeleteTemplate}
                                        isSelectable={!!workOrderId}
                                        isSelected={selectedTemplateIds.includes(template.id)}
                                    />
                                )
                            })}
                            
                            {/* Loading indicator for infinite scroll */}
                            {isFetchingNextPage && (
                                <div className="text-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                                    <p className="text-muted-foreground dark:text-gray-400 text-sm">Loading more templates...</p>
                                </div>
                            )}
                            
                            {/* End of results indicator */}
                            {!hasNextPage && filteredTemplates.length > 20 && (
                                <div className="text-center py-4">
                                    <p className="text-muted-foreground dark:text-gray-500 text-sm">
                                        Showing all {filteredTemplates.length} templates
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="h-8 w-8 text-muted-foreground dark:text-gray-500 mx-auto mb-2" />
                            <p className="text-muted-foreground dark:text-gray-500 text-base">
                                {searchTerm || selectedCategory !== 'all' || selectedItemType !== 'all'
                                    ? 'No templates found'
                                    : 'No templates created yet'
                                }
                            </p>
                            <p className="text-muted-foreground dark:text-gray-600 text-sm mt-1">
                                {searchTerm || selectedCategory !== 'all' || selectedItemType !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Create your first template to get started'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
