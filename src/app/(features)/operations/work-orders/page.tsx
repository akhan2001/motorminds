'use client'

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { WorkOrderKanban, WorkOrderHeader } from "../components/work-orders";
import { WorkOrderCreateModal } from "../components/work-orders/create";
import { WorkOrderEditModal } from "../components/work-orders/manage/work-order-edit-modal";
import { WorkOrderCompletionModal } from "../components/work-orders/complete";
import { WorkOrderItemTemplatesModal } from "../components/work-order-items/templates/work-order-item-templates-modal";
import { DragDropProvider } from "../components/work-orders/DragDrop";
import { useWorkOrderStats } from "../hooks/use-work-order-stats";
import { useWorkOrdersWithDetails, useCreateWorkOrderWithDependencies, useCreateWalkInWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder } from "../hooks/use-work-orders";
import { useAuth } from "../hooks/use-auth";
import { WorkOrderItemsService } from "../lib/work-order-items-service";
import type { WorkOrderItemCreateData } from "../types/work-order-items";
import type { WorkOrder, WorkOrderKanbanColumn, WorkOrderKanbanItem, WorkOrderWithDetails } from "../types/work-order";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/common/feedback/loading-states";
import { toast } from "sonner";

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

// Helper function to create work order items from labor items
async function createWorkOrderItemsFromLaborItems(workOrderId: string, laborItems: any[]) {
    const itemPromises = laborItems.map(async (item) => {
        const itemData: WorkOrderItemCreateData = {
            work_order_id: workOrderId,
            item_type: 'labor' as const,
            description: item.description,
            quantity: 1, // Labor items typically have quantity of 1
            unit_price: item.unit_price,
            labor_hours: item.labor_hours,
            notes: item.notes,
            technician_id: item.technician_id,
        }

        return WorkOrderItemsService.createWorkOrderItem(itemData)
    })

    return Promise.all(itemPromises)
}

// Helper function to create work order items from parts items
async function createWorkOrderItemsFromPartsItems(workOrderId: string, partsItems: any[]) {
    const itemPromises = partsItems.map(async (item) => {
        const itemData: WorkOrderItemCreateData = {
            work_order_id: workOrderId,
            item_type: 'part' as const,
            description: item.description,
            part_number: item.part_number,
            quantity: item.quantity,
            unit_price: item.unit_price,
            supplier: item.supplier,
            category: item.category,
            warranty_period: item.warranty_period,
            notes: item.notes,
        }

        return WorkOrderItemsService.createWorkOrderItem(itemData)
    })

    return Promise.all(itemPromises)
}

// Helper function to transform WorkOrderWithDetails to WorkOrderKanbanItem
function transformWorkOrderToKanbanItem(workOrder: WorkOrderWithDetails): WorkOrderKanbanItem {
    // Format customer display - handle walk-in customers
    let customerDisplay: string
    if (workOrder.customer_type === 'walk_in') {
        customerDisplay = 'Walk-in Customer'
    } else if (workOrder.customer) {
        customerDisplay = workOrder.customer.customer_name
    } else {
        customerDisplay = 'Unknown Customer'
    }

    // Format vehicle display - handle walk-in vehicles
    let vehicleDisplay: string
    if (workOrder.customer_type === 'walk_in' && workOrder.walk_in_vehicle_info) {
        const info = workOrder.walk_in_vehicle_info
        vehicleDisplay = `${info.year} ${info.make} ${info.model}${info.license_plate ? ` (${info.license_plate})` : ''}`
    } else if (workOrder.vehicle) {
        vehicleDisplay = `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}${workOrder.vehicle.license_plate ? ` (${workOrder.vehicle.license_plate})` : ''}`
    } else {
        vehicleDisplay = 'Unknown Vehicle'
    }

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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function WorkOrdersContent() {
    // Navigation
    const router = useRouter()
    const searchParams = useSearchParams()

    // Authentication
    const { user, shopId, isLoading: authLoading, error: authError } = useAuth()

    // Data fetching - only fetch if we have a valid shopId
    const { data: workOrders, isLoading: workOrdersLoading, error: workOrdersError, refetch } = useWorkOrdersWithDetails(shopId || '')
    const createWorkOrderMutation = useCreateWorkOrderWithDependencies()
    const createWalkInWorkOrderMutation = useCreateWalkInWorkOrder()
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

    // Handle URL parameter changes to open/close modal
    useEffect(() => {
        const workOrderId = searchParams?.get('id')

        if (workOrderId && workOrders) {
            // Find the work order in the current data
            const foundWorkOrder = workOrders.find(wo => wo.id === workOrderId)

            if (foundWorkOrder) {
                // Convert to kanban item format
                const kanbanItem = transformWorkOrderToKanbanItem(foundWorkOrder)
                setSelectedWorkOrder(kanbanItem)
                setIsModalOpen(true)
            } else {
                // Work order not found, remove from URL
                router.replace('/operations/work-orders')
            }
        } else {
            // No work order ID in URL, close modal
            setIsModalOpen(false)
            setSelectedWorkOrder(null)
        }
    }, [searchParams, workOrders, router])

    // Handle work order card clicks
    const handleCardClick = (item: WorkOrderKanbanItem) => {
        // Update URL without navigation
        router.push(`/operations/work-orders?id=${item.id}`)
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

    // Handle work order items
    const handleWorkOrderItems = () => {
        router.push('/operations/work-order-items')
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
            let newWorkOrder: WorkOrder

            // Check if this is a walk-in customer
            if (workOrderData.customerType === 'walk_in') {
                console.log('Creating walk-in work order')
                
                // Prepare walk-in work order payload
                const walkInPayload = {
                    workOrder: {
                        work_order_number: '', // Will be auto-generated by service
                        title: workOrderData.title,
                        description: workOrderData.description,
                        status: 'pending' as const,
                        priority: workOrderData.priority,
                        shop_id: shopId,
                        // Ensure selected/created vehicle is linked on create
                        vehicle_id: workOrderData.vehicleId || undefined,
                        assigned_technician_id: workOrderData.assigneeId || undefined,
                        tags: workOrderData.tags || [],
                        attachments: [],
                        notes: workOrderData.notes || undefined,
                    },
                    walkInVehicleInfo: workOrderData.walkInVehicleInfo
                }

                console.log('Creating walk-in work order with payload:', walkInPayload)
                newWorkOrder = await createWalkInWorkOrderMutation.mutateAsync(walkInPayload)
            } else {
                console.log('Creating registered customer work order')
                
                // Prepare the data structure for registered customer
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
                        customer_type: 'registered' as const,
                        walk_in_vehicle_info: undefined,
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
                newWorkOrder = await createWorkOrderMutation.mutateAsync(payload)
            }

            // Track total items created for user feedback
            let totalItemsCreated = 0

            // Create work order items from selected templates
            if (workOrderData.selectedTemplates && workOrderData.selectedTemplates.length > 0) {
                try {
                    await createWorkOrderItemsFromTemplates(newWorkOrder.id, workOrderData.selectedTemplates)
                    totalItemsCreated += workOrderData.selectedTemplates.length
                } catch (error) {
                    console.error('Failed to create work order items from templates:', error)
                    // Don't fail the entire operation if items creation fails
                }
            }

            // Create work order items from labor items
            if (workOrderData.laborItems && workOrderData.laborItems.length > 0) {
                try {
                    await createWorkOrderItemsFromLaborItems(newWorkOrder.id, workOrderData.laborItems)
                    totalItemsCreated += workOrderData.laborItems.length
                } catch (error) {
                    console.error('Failed to create work order items from labor items:', error)
                    // Don't fail the entire operation if items creation fails
                }
            }

            // Create work order items from parts items
            if (workOrderData.partsItems && workOrderData.partsItems.length > 0) {
                try {
                    await createWorkOrderItemsFromPartsItems(newWorkOrder.id, workOrderData.partsItems)
                    totalItemsCreated += workOrderData.partsItems.length
                } catch (error) {
                    console.error('Failed to create work order items from parts items:', error)
                    // Don't fail the entire operation if items creation fails
                }
            }

            setIsCreateModalOpen(false)

            // Show success message with items count
            if (totalItemsCreated > 0) {
                toast.success(`Work order created with ${totalItemsCreated} items`)
            }
        } catch (error) {
            console.error('Failed to create work order:', error)
            // Error handling is done in the mutation hook
        }
    }

    // Handle modal close
    const handleModalClose = () => {
        // Remove work order ID from URL without navigation
        router.replace('/operations/work-orders')
    }

    // Handle work order save
    const handleWorkOrderSave = async (updatedWorkOrder: WorkOrderKanbanItem, formData?: any) => {
        try {
            // Use the work order ID from the updated work order
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

            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: updateData
            })

            // Refetch to get updated data
            refetch()

            // Update local state
            setSelectedWorkOrder(updatedWorkOrder)
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
            // Close modal by removing ID from URL
            router.replace('/operations/work-orders')
        } catch (error) {
            console.error('Failed to delete work order:', error)
            // Error handling is done in the mutation hook
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <LoadingSpinner size="md" className="text-blue-500" />
                            <div>
                                <p className="text-foreground font-medium">Loading Work Orders</p>
                                <p className="text-muted-foreground text-sm">Fetching data from database...</p>
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
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <div>
                                <p className="text-foreground font-medium">Failed to Load Work Orders</p>
                                <p className="text-muted-foreground text-sm mb-3">
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
            <div className="h-screen flex flex-col bg-background">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="bg-card border-border">
                        <CardContent className="flex items-center gap-4 p-6">
                            <AlertCircle className="h-6 w-6 text-yellow-500" />
                            <div>
                                <p className="text-foreground font-medium">Authentication Required</p>
                                <p className="text-muted-foreground text-sm mb-3">
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
            <div className="h-screen flex flex-col bg-background">
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

                {/* Work Order Edit Modal (Manage Phase) */}
                {isModalOpen && selectedWorkOrder && (
                    <WorkOrderEditModal
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

// Loading component for Suspense fallback
function WorkOrdersLoading() {
    return (
        <div className="h-screen flex flex-col bg-background">
            <Nav />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-foreground">Loading...</div>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function WorkOrdersPage() {
    return (
        <Suspense fallback={<WorkOrdersLoading />}>
            <WorkOrdersContent />
        </Suspense>
    )
}