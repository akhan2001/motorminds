'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Search, Filter, Package } from 'lucide-react'
import { WorkOrderItemTemplateCard } from './work-order-item-template-card'
import { WorkOrderItemTemplateCardSmall } from './work-order-item-template-card-small'
import { WorkOrderItemTemplateForm } from './work-order-item-template-form'
import { useWorkOrderItemTemplates, useDeleteWorkOrderItemTemplate } from '../../../hooks/use-work-order-item-templates'
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
    className?: string
}

export const WorkOrderItemTemplatesPanel: React.FC<WorkOrderItemTemplatesPanelProps> = ({
    shopId,
    workOrderId,
    technicianId,
    onTemplateSelected,
    selectedTemplateIds = [],
    className = ""
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<WorkOrderItemTemplate | null>(null)
    
    // Get panel context to determine card size
    const { context } = usePanelContext()
    const useSmallCard = context === 'work-order-modal' || context === 'work-order-edit'

    // Hooks
    const { data: templates = [], isLoading, error } = useWorkOrderItemTemplates(shopId)
    const deleteTemplateMutation = useDeleteWorkOrderItemTemplate()
    const cloneTemplateMutation = useCloneTemplateToWorkOrder()
    
    // Get predefined categories
    const categories = getTemplateCategories().map(cat => cat.value)

    // Filter templates based on search and category
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            template.category?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
        
        return matchesSearch && matchesCategory
    })

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

    const handleEditTemplate = (template: WorkOrderItemTemplate) => {
        setEditingTemplate(template)
        setIsFormOpen(true)
    }

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await deleteTemplateMutation.mutateAsync(templateId)
        } catch (error) {
            console.error('Failed to delete template:', error)
        }
    }

    const handleCreateTemplate = () => {
        setEditingTemplate(null)
        setIsFormOpen(true)
    }

    const handleFormSuccess = () => {
        setIsFormOpen(false)
        setEditingTemplate(null)
    }

    const handleFormCancel = () => {
        setIsFormOpen(false)
        setEditingTemplate(null)
    }

    if (isLoading) {
        return (
            <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-white font-medium text-sm">Templates</h3>
                        <p className="text-gray-400 text-xs mt-1">Reusable work order items</p>
                    </div>
                </div>

                {/* Loading State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-400 text-base">Loading templates...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
                {/* Header */}
                <div className="p-4 border-b border-[#222222] flex-shrink-0">
                    <div>
                        <h3 className="text-white font-medium text-sm">Templates</h3>
                        <p className="text-gray-400 text-xs mt-1">Reusable work order items</p>
                    </div>
                </div>

                {/* Error State */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Package className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-400 text-base">Failed to load templates</p>
                        <p className="text-gray-500 text-sm mt-1">{error.message}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Header */}
            <div className="p-4 border-b border-[#222222] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-white font-medium text-base">Templates</h3>
                        <p className="text-gray-400 text-sm mt-1">Reusable work order items</p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleCreateTemplate}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        New
                    </Button>
                </div>

                {/* Search and Filter */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                        <Input
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-[#292929] text-white border-[#626262] text-sm"
                        />
                    </div>
                    
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="bg-[#292929] text-white border-[#626262] text-sm">
                            <Filter className="h-3 w-3 mr-2" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#292929] text-white border-[#626262]">
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

            {/* Content Area - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className={`p-4 ${useSmallCard ? 'space-y-2' : 'space-y-3'} overflow-y-auto`}>
                    {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => {
                            const CardComponent = useSmallCard ? WorkOrderItemTemplateCardSmall : WorkOrderItemTemplateCard
                            return (
                                <CardComponent
                                    key={template.id}
                                    template={template}
                                    onSelect={workOrderId ? handleTemplateSelect : undefined}
                                    onEdit={handleEditTemplate}
                                    onDelete={handleDeleteTemplate}
                                    isSelectable={!!workOrderId}
                                    isSelected={selectedTemplateIds.includes(template.id)}
                                />
                            )
                        })
                    ) : (
                        <div className="text-center py-8">
                            <Package className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-500 text-base">
                                {searchTerm || selectedCategory !== 'all' 
                                    ? 'No templates found' 
                                    : 'No templates created yet'
                                }
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                                {searchTerm || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filter'
                                    : 'Create your first template to get started'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Template Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingTemplate ? 'Edit Template' : 'Create New Item Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <DialogDescription className="text-gray-400">
                        Create templates for parts, labor, services, and fees.
                    </DialogDescription>

                    <WorkOrderItemTemplateForm
                        template={editingTemplate || undefined}
                        shopId={shopId}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
