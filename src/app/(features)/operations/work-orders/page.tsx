'use client'

import { useState, useMemo } from "react";
import { Nav } from "@/app/components/nav";
import { WorkOrderKanban, WorkOrderHeader } from "../components/work-orders";
import { WorkOrderDetailsModal, WorkOrderCreateModal } from "../components/work-orders/WorkOrderModal";
import { WorkOrderCompletionModal } from "../components/work-orders/WorkOrderCompletionModal";
import { WorkOrderItemTemplatesModal } from "../components/work-order-items/templates/work-order-item-templates-modal";
import { DragDropProvider } from "../components/work-orders/DragDrop";
import { useWorkOrderStats } from "../hooks/use-work-order-stats";
import { useWorkOrdersWithDetails, useCreateWorkOrderWithDependencies, useUpdateWorkOrder, useDeleteWorkOrder } from "../hooks/use-work-orders";
import { useAuth } from "../hooks/use-auth";
import { WorkOrderItemsService } from "../lib/work-order-items-service";
import type { WorkOrderItemCreateData } from "../types/work-order-items";
import type { WorkOrder, WorkOrderKanbanColumn, WorkOrderKanbanItem, WorkOrderWithDetails } from "../types/work-order";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

// Helper function to create work order items from selected templates
async function createWorkOrderItemsFromTemplates(workOrderId: string, selectedTemplates: any[]) {
    const itemPromises = selectedTemplates.map(async (template) => {
        const itemData: WorkOrderItemCreateData = {
            work_order_id: workOrderId,
            item_type: template.item_type,
            description: template.name, // Use template name as description
            part_number: template.part_number,
            quantity: template.selectedQuantity || template.quantity,
            unit_price: template.selectedUnitPrice || template.unit_price,
            unit_cost: template.unit_cost,
            supplier: template.supplier,
            category: template.category,
            warranty_period: template.warranty_period,
            notes: template.description, // Use template description as notes
            labor_hours: template.selectedLaborHours || template.labor_hours,
            technician_id: template.selectedTechnicianId,
        }
        
        return WorkOrderItemsService.createWorkOrderItem(itemData)
    })
    
    return Promise.all(itemPromises)
}

// Helper function to transform WorkOrderWithDetails to WorkOrderKanbanItem
function transformWorkOrderToKanbanItem(workOrder: WorkOrderWithDetails): WorkOrderKanbanItem {
    // Format customer display
    const customerDisplay = workOrder.customer 
        ? workOrder.customer.customer_name 
        : 'Unknown Customer'
    
    // Format vehicle display  
    const vehicleDisplay = workOrder.vehicle 
        ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}${workOrder.vehicle.license_plate ? ` (${workOrder.vehicle.license_plate})` : ''}`
        : 'Unknown Vehicle'
    
    // Format technician display
    const technicianDisplay = workOrder.technician 
        ? `${workOrder.technician.first_name} ${workOrder.technician.last_name || ''}`
        : workOrder.assigned_technician_id || 'Unassigned'
        
    return {
        id: workOrder.id,
        title: workOrder.title,
        description: workOrder.description,
        status: workOrder.status,
        priority: workOrder.priority,
        assignee: technicianDisplay,
        date: workOrder.created_at.split('T')[0],
        customer: customerDisplay,
        vehicle: vehicleDisplay,
        tags: workOrder.tags || [],
        shop_id: workOrder.shop_id
    }
}

export default function WorkOrdersPage() {
    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()
    
    // Data fetching - only fetch if we have a valid shopId
    const { data: workOrders, isLoading: workOrdersLoading, error: workOrdersError, refetch } = useWorkOrdersWithDetails(shopId || '')
    const createWorkOrderMutation = useCreateWorkOrderWithDependencies()
    const updateWorkOrderMutation = useUpdateWorkOrder()
    const deleteWorkOrderMutation = useDeleteWorkOrder()
    
    // Combined loading state
    const isLoading = authLoading || (shopId && workOrdersLoading)
    // Combined error state
    const error = authError || workOrdersError
    
    // Transform work orders to kanban format
    const kanbanData = useMemo(() => {
        if (!workOrders) return []
        
        const pending = workOrders.filter(wo => wo.status === 'pending' || wo.status === 'approved')
        const inProgress = workOrders.filter(wo => wo.status === 'in_progress' || wo.status === 'waiting_parts' || wo.status === 'waiting_customer')
        const completed = workOrders.filter(wo => wo.status === 'completed' || wo.status === 'invoiced')
        
        return [
            {
                id: 'pending',
                title: 'Estimates',
                color: 'bg-yellow-500',
                items: pending.map(transformWorkOrderToKanbanItem)
            },
            {
                id: 'in-progress',
                title: 'In Progress', 
                color: 'bg-blue-500',
                items: inProgress.map(transformWorkOrderToKanbanItem)
            },
            {
                id: 'completed',
                title: 'Completed',
                color: 'bg-green-500',
                items: completed.map(transformWorkOrderToKanbanItem)
            }
        ]
    }, [workOrders])
    
    // Calculate stats using custom hook
    const stats = useWorkOrderStats(kanbanData)
    
    // Modal state
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderKanbanItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    
    // View state
    const [isCompactView, setIsCompactView] = useState(false)
    
    // Completion modal state
    const [completionWorkOrder, setCompletionWorkOrder] = useState<WorkOrderWithDetails | null>(null)
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
    
    // Templates modal state
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)

    // Handle work order card clicks
    const handleCardClick = (item: WorkOrderKanbanItem) => {
        setSelectedWorkOrder(item)
        setIsModalOpen(true)
    }

    // Handle view toggle
    const handleToggleView = () => {
        setIsCompactView(prev => !prev)
    }

    // Handle new work order
    const handleNewWorkOrder = () => {
        setIsCreateModalOpen(true)
    }

    // Handle templates modal
    const handleTemplatesClick = () => {
        setIsTemplatesModalOpen(true)
    }

    const handleTemplatesModalClose = () => {
        setIsTemplatesModalOpen(false)
    }

    // Handle create modal close
    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false)
    }

    // Handle work order completion attempt
    const handleWorkOrderCompletionAttempt = async (item: WorkOrderKanbanItem) => {
        // Find the full work order details from the workOrders array
        const fullWorkOrder = workOrders?.find(wo => wo.id === item.id)
        if (fullWorkOrder) {
            setCompletionWorkOrder(fullWorkOrder)
            setIsCompletionModalOpen(true)
        }
    }

    // Handle completion modal close
    const handleCompletionModalClose = () => {
        setIsCompletionModalOpen(false)
        setCompletionWorkOrder(null)
    }

    // Handle completion modal confirm
    const handleCompletionModalConfirm = async (sendMessage: boolean, customMessage?: string) => {
        if (completionWorkOrder) {
            try {
                // Update work order status to completed
                const updateData: Partial<WorkOrder> = { 
                    status: 'completed',
                    updated_at: new Date().toISOString(),
                    completed_at: new Date().toISOString()
                }

                await updateWorkOrderMutation.mutateAsync({
                    id: completionWorkOrder.id,
                    data: updateData
                })

                // Refetch work orders
                refetch()
                
                // Close modal
                handleCompletionModalClose()
            } catch (error) {
                console.error('Failed to complete work order:', error)
            }
        }
    }

    // Handle work order creation
    const handleWorkOrderCreate = async (workOrderData: any) => {
        if (!shopId || !user) {
            console.error('Missing authentication data')
            return
        }

        try {
            // Prepare the data structure for the new mutation hook
            const payload = {
                workOrder: {
                    work_order_number: '', // Will be auto-generated by service
                    title: workOrderData.title,
                    description: workOrderData.description,
                    status: 'pending' as const,
                    priority: workOrderData.priority,
                    shop_id: shopId,
                    assigned_technician_id: workOrderData.assigneeId || undefined,
                    tags: workOrderData.tags || [],
                    attachments: [],
                    notes: workOrderData.notes || undefined,
                },
                customer: {
                    id: workOrderData.customerId === "new" ? undefined : workOrderData.customerId,
                    name: workOrderData.customer || 'Unknown Customer',
                    email: workOrderData.customerEmail || undefined,
                    phone: workOrderData.customerPhone || undefined,
                    address: workOrderData.customerAddress || undefined,
                },
                vehicle: {
                    id: workOrderData.vehicleId === "new" ? undefined : workOrderData.vehicleId,
                    year: workOrderData.vehicleYear || new Date().getFullYear().toString(),
                    make: workOrderData.vehicleMake || 'Unknown',
                    model: workOrderData.vehicleModel || 'Unknown',
                    color: workOrderData.vehicleColor || undefined,
                    vin: workOrderData.vehicleVin || undefined,
                    license_plate: workOrderData.vehicleLicensePlate || undefined,
                    mileage: workOrderData.vehicleMileage || undefined,
                }
            }
            
            console.log('Creating work order with payload:', payload)
            const newWorkOrder = await createWorkOrderMutation.mutateAsync(payload)
            
            // Create work order items from selected templates
            if (workOrderData.selectedTemplates && workOrderData.selectedTemplates.length > 0) {
                try {
                    await createWorkOrderItemsFromTemplates(newWorkOrder.id, workOrderData.selectedTemplates)
                } catch (error) {
                    console.error('Failed to create work order items from templates:', error)
                    // Don't fail the entire operation if items creation fails
                }
            }
            
            setIsCreateModalOpen(false)
        } catch (error) {
            console.error('Failed to create work order:', error)
            // Error handling is done in the mutation hook
        }
    }

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedWorkOrder(null)
    }

    // Handle work order save
    const handleWorkOrderSave = async (updatedWorkOrder: WorkOrderKanbanItem, formData?: any) => {
        try {
            // Use the work order ID from the updated work order (which should have the correct database ID)
            const workOrderId = updatedWorkOrder.id
            
            // Prepare the update data
            const updateData: Partial<WorkOrder> = {
                title: updatedWorkOrder.title,
                description: updatedWorkOrder.description,
                priority: updatedWorkOrder.priority,
                tags: updatedWorkOrder.tags,
            }

            // Include notes if provided in formData
            if (formData?.notes !== undefined) {
                updateData.notes = formData.notes
            }

            // Include other form fields if provided
            if (formData) {
                // Map assignee back to assigned_technician_id if it's a UUID
                if (formData.assigneeId) {
                    updateData.assigned_technician_id = formData.assigneeId
                }
            }

            console.log('Updating work order with ID:', workOrderId, 'Data:', updateData)

            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: updateData
            })

            setIsModalOpen(false)
        } catch (error) {
            console.error('Failed to update work order:', error)
            // Error handling is done in the mutation hook
        }
    }

    // Handle work order delete
    const handleWorkOrderDelete = async (workOrderId: string) => {
        try {
            await deleteWorkOrderMutation.mutateAsync(workOrderId)
            refetch() // Refetch work orders to update the list
            setIsModalOpen(false)
        } catch (error) {
            console.error('Failed to delete work order:', error)
            // Error handling is done in the mutation hook
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <div>
                                <p className="text-white font-medium">Loading Work Orders</p>
                                <p className="text-gray-400 text-sm">Fetching data from database...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-white font-medium">Failed to Load Work Orders</p>
                                <p className="text-gray-400 text-sm mb-3">
                                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                                </p>
                                <button 
                                    onClick={() => refetch()}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                                >
                                    Try Again
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Don't render main content if we don't have authentication data
    if (!shopId || !user) {
        return (
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-white font-medium">Authentication Required</p>
                                <p className="text-gray-400 text-sm mb-3">
                                    Unable to access work orders. Please ensure you are logged in.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <DragDropProvider 
            onWorkOrderUpdate={(workOrderId, newStatus) => {
                // Refetch work orders when status is updated via drag and drop
                refetch()
            }}
            onWorkOrderCompletionAttempt={handleWorkOrderCompletionAttempt}
        >
            <div className="h-screen flex flex-col bg-[#0d0d0d]">
                <Nav />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <WorkOrderHeader 
                        isCompactView={isCompactView}
                        onToggleView={handleToggleView}
                        onNewWorkOrder={handleNewWorkOrder}
                        onTemplatesClick={handleTemplatesClick}
                    />
                    <div className="flex-1 overflow-hidden">
                        <WorkOrderKanban 
                            columns={kanbanData}
                            onCardClick={handleCardClick}
                            isCompactView={isCompactView}
                        />
                    </div>
                </div>

                {/* Work Order Details Modal */}
                {isModalOpen && selectedWorkOrder && (
                    <WorkOrderDetailsModal
                        workOrder={selectedWorkOrder}
                        onClose={handleModalClose}
                        onSave={handleWorkOrderSave}
                        onDelete={handleWorkOrderDelete}
                    />
                )}

                {/* Work Order Create Modal */}
                {isCreateModalOpen && (
                    <WorkOrderCreateModal 
                        onClose={handleCreateModalClose}
                        onSave={handleWorkOrderCreate}
                        shopId={shopId}
                    />
                )}

                {/* Work Order Completion Modal */}
                {isCompletionModalOpen && completionWorkOrder && (
                    <WorkOrderCompletionModal
                        workOrder={completionWorkOrder}
                        isOpen={isCompletionModalOpen}
                        onClose={handleCompletionModalClose}
                        onConfirm={handleCompletionModalConfirm}
                    />
                )}

                {/* Work Order Item Templates Modal */}
                {isTemplatesModalOpen && shopId && (
                    <WorkOrderItemTemplatesModal
                        isOpen={isTemplatesModalOpen}
                        onClose={handleTemplatesModalClose}
                        shopId={shopId}
                    />
                )}
            </div>
        </DragDropProvider>
    )
}