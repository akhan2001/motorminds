'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WorkOrderItemTemplatesPanel } from './work-order-item-templates-panel'
import { WorkOrderItemTemplateForm } from './work-order-item-template-form'
import { useWorkOrderItemTemplates } from '../../../hooks/use-work-order-item-templates'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'

interface WorkOrderItemTemplatesModalProps {
    isOpen: boolean
    onClose: () => void
    shopId: string
    className?: string
}

export const WorkOrderItemTemplatesModal: React.FC<WorkOrderItemTemplatesModalProps> = ({
    isOpen,
    onClose,
    shopId,
    className = ""
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<WorkOrderItemTemplate | null>(null)

    const handleCreateTemplate = () => {
        setEditingTemplate(null)
        setIsFormOpen(true)
    }

    const handleEditTemplate = (template: WorkOrderItemTemplate) => {
        setEditingTemplate(template)
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl bg-[#111111] border-[#2a2a2a] max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        Work Order Item Templates
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-gray-400">
                    Templates help you save time and improve accuracy by providing pre-defined items for your work orders.
                </DialogDescription>

                <div className="flex-1 overflow-hidden">
                    {isFormOpen ? (
                        <div className="h-full overflow-y-auto">
                            <WorkOrderItemTemplateForm
                                template={editingTemplate || undefined}
                                shopId={shopId}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    ) : (
                        <WorkOrderItemTemplatesPanel
                            shopId={shopId}
                            className="h-full"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
