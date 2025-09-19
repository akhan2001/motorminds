'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Package } from 'lucide-react'
import { WorkOrderItemCard } from './work-order-item-card'
import { WorkOrderItemForm } from './work-order-item-form'
import { WorkOrderItemsSummary } from './work-order-items-summary'
import { 
    useWorkOrderItems, 
    useCreateWorkOrderItem, 
    useUpdateWorkOrderItem, 
    useDeleteWorkOrderItem,
    useCompleteWorkOrderItem 
} from '../../hooks/use-work-order-items'
import type { WorkOrderItem, WorkOrderItemFormData } from '../../types/work-order-items'

interface WorkOrderItemsListProps {
    workOrderId: string
    isEditable?: boolean
    className?: string
}

export const WorkOrderItemsList: React.FC<WorkOrderItemsListProps> = ({
    workOrderId,
    isEditable = true,
    className = ""
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<WorkOrderItem | null>(null)

    // Hooks
    const { data: items = [], isLoading, error } = useWorkOrderItems(workOrderId)
    const createItemMutation = useCreateWorkOrderItem()
    const updateItemMutation = useUpdateWorkOrderItem()
    const deleteItemMutation = useDeleteWorkOrderItem()
    const completeItemMutation = useCompleteWorkOrderItem()

    const handleCreateItem = () => {
        setEditingItem(null)
        setIsFormOpen(true)
    }

    const handleEditItem = (item: WorkOrderItem) => {
        setEditingItem(item)
        setIsFormOpen(true)
    }

    const handleFormSubmit = async (formData: WorkOrderItemFormData) => {
        try {
            if (editingItem) {
                // Update existing item
                await updateItemMutation.mutateAsync({
                    id: editingItem.id,
                    data: formData
                })
            } else {
                // Create new item
                await createItemMutation.mutateAsync({
                    work_order_id: workOrderId,
                    ...formData
                })
            }
            setIsFormOpen(false)
            setEditingItem(null)
        } catch (error) {
            // Error handled by mutation hooks
            console.error('Failed to save item:', error)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteItemMutation.mutateAsync(itemId)
            } catch (error) {
                // Error handled by mutation hooks
                console.error('Failed to delete item:', error)
            }
        }
    }

    const handleCompleteItem = async (itemId: string) => {
        try {
            await completeItemMutation.mutateAsync(itemId)
        } catch (error) {
            // Error handled by mutation hooks
            console.error('Failed to complete item:', error)
        }
    }

    const handleFormCancel = () => {
        setIsFormOpen(false)
        setEditingItem(null)
    }

    if (isLoading) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Work Order Items</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-[#1a1a1a] rounded-lg animate-pulse border border-[#2a2a2a]" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`space-y-4 ${className}`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">Work Order Items</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-400 text-sm">Failed to load work order items</p>
                    <p className="text-gray-500 text-xs mt-1">{error.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Work Order Items
                </h3>
                {isEditable && (
                    <Button
                        size="sm"
                        onClick={handleCreateItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                    </Button>
                )}
            </div>

            {/* Summary */}
            <WorkOrderItemsSummary workOrderId={workOrderId} />

            {/* Items List */}
            <div className="space-y-3">
                {items.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-[#2a2a2a] rounded-lg">
                        <Package className="h-8 w-8 mx-auto text-gray-500 mb-2" />
                        <p className="text-gray-400 text-sm mb-2">No items added yet</p>
                        {isEditable && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCreateItem}
                                className="border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Item
                            </Button>
                        )}
                    </div>
                ) : (
                    items.map((item) => (
                        <WorkOrderItemCard
                            key={item.id}
                            item={item}
                            onEdit={isEditable ? handleEditItem : undefined}
                            onDelete={isEditable ? handleDeleteItem : undefined}
                            onComplete={isEditable ? handleCompleteItem : undefined}
                            isEditable={isEditable}
                        />
                    ))
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl bg-[#111111] border-[#2a2a2a] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingItem ? 'Edit Work Order Item' : 'Add Work Order Item'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <WorkOrderItemForm
                        item={editingItem}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                        isSubmitting={createItemMutation.isPending || updateItemMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
