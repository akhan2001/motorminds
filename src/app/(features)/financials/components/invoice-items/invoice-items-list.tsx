'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Upload, AlertCircle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InvoiceItemCard } from './invoice-item-card'
import { InvoiceItemForm } from './invoice-item-form'
import {
    useInvoiceItems,
    useCreateInvoiceItem,
    useUpdateInvoiceItem,
    useDeleteInvoiceItem,
    useDuplicateInvoiceItem,
    useRestoreInvoiceItem,
} from '../../hooks/use-invoice-items'
import type { InvoiceItem, InvoiceItemFormData, InvoiceItemCreateData } from '../../types/invoice-items'

interface InvoiceItemsListProps {
    invoiceId: string
    shopId: string
    isEditable?: boolean
    onImportFromWorkOrder?: () => void
    className?: string
}

export const InvoiceItemsList: React.FC<InvoiceItemsListProps> = ({
    invoiceId,
    shopId,
    isEditable = true,
    onImportFromWorkOrder,
    className,
}) => {
    const [isAdding, setIsAdding] = useState(false)
    const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null)

    // Queries and mutations
    const { data: items = [], isLoading, error } = useInvoiceItems(invoiceId)
    const createMutation = useCreateInvoiceItem()
    const updateMutation = useUpdateInvoiceItem()
    const deleteMutation = useDeleteInvoiceItem()
    const duplicateMutation = useDuplicateInvoiceItem()
    const restoreMutation = useRestoreInvoiceItem()

    const handleAdd = () => {
        setIsAdding(true)
        setEditingItem(null)
    }

    const handleEdit = (item: InvoiceItem) => {
        setEditingItem(item)
        setIsAdding(false)
    }

    const handleCancelForm = () => {
        setIsAdding(false)
        setEditingItem(null)
    }

    const handleSubmitNew = async (formData: InvoiceItemFormData) => {
        const createData: InvoiceItemCreateData = {
            ...formData,
            invoice_id: invoiceId,
            shop_id: shopId,
        }

        try {
            await createMutation.mutateAsync(createData)
            setIsAdding(false)
        } catch (error) {
            console.error('Failed to create item:', error)
        }
    }

    const handleSubmitEdit = async (formData: InvoiceItemFormData) => {
        if (!editingItem) return

        try {
            await updateMutation.mutateAsync({
                itemId: editingItem.id,
                updates: formData,
            })
            setEditingItem(null)
        } catch (error) {
            console.error('Failed to update item:', error)
        }
    }

    const handleDelete = async (itemId: string) => {
        if (!confirm('Are you sure you want to remove this item?')) return

        try {
            await deleteMutation.mutateAsync({ itemId, invoiceId })
        } catch (error) {
            console.error('Failed to delete item:', error)
        }
    }

    const handleDuplicate = async (itemId: string) => {
        try {
            await duplicateMutation.mutateAsync(itemId)
        } catch (error) {
            console.error('Failed to duplicate item:', error)
        }
    }

    const handleRestore = async (itemId: string) => {
        try {
            await restoreMutation.mutateAsync(itemId)
        } catch (error) {
            console.error('Failed to restore item:', error)
        }
    }

    if (isLoading) {
        return (
            <div className={cn('space-y-3', className)}>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-32 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg animate-pulse"
                    />
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className={cn('flex items-center justify-center p-8', className)}>
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                    <p className="text-red-400 text-sm">Failed to load invoice items</p>
                    <p className="text-gray-500 text-xs mt-1">Please try refreshing the page</p>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
                    <p className="text-sm text-gray-400">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                    </p>
                </div>
                {isEditable && (
                    <div className="flex items-center gap-2">
                        {onImportFromWorkOrder && (
                            <Button
                                onClick={onImportFromWorkOrder}
                                variant="outline"
                                size="sm"
                                className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Import from Work Order
                            </Button>
                        )}
                        <Button
                            onClick={handleAdd}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={isAdding || !!editingItem}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                )}
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingItem) && (
                <InvoiceItemForm
                    onSubmit={editingItem ? handleSubmitEdit : handleSubmitNew}
                    onCancel={handleCancelForm}
                    initialData={editingItem}
                    isLoading={createMutation.isPending || updateMutation.isPending}
                />
            )}

            {/* Items List */}
            {items.length === 0 && !isAdding ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#2a2a2a] rounded-lg">
                    <Package className="h-12 w-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm mb-4">No items added yet</p>
                    {isEditable && (
                        <Button
                            onClick={handleAdd}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Item
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <InvoiceItemCard
                            key={item.id}
                            item={item}
                            onEdit={isEditable ? handleEdit : undefined}
                            onDelete={isEditable ? handleDelete : undefined}
                            onDuplicate={isEditable ? handleDuplicate : undefined}
                            onRestore={isEditable ? handleRestore : undefined}
                            isEditable={isEditable}
                        />
                    ))}
                </div>
            )}

            {/* Info Messages */}
            {items.some((item) => item.is_from_work_order && item.is_modified) && (
                <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-orange-400 font-medium">Modified Items</p>
                        <p className="text-xs text-orange-300/80 mt-0.5">
                            Some items have been modified from their original work order values. You can restore
                            them using the restore button.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InvoiceItemsList

