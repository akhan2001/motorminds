// Custom hook for work order form state management
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useUpdateWorkOrder, useUpdateWorkOrderStatus } from '../../../../hooks/use-work-orders'
import { canEditWorkOrder } from '../../../../lib/constants/work-orders'
import type { WorkOrderWithDetails, WorkOrderPriority } from '../../../../types/work-order'

interface WorkOrderFormData {
    title: string
    description: string
    priority: WorkOrderPriority
    assignee: string
    date: string
    customer: string
    vehicle: string
    tags: string[]
    customerEmail: string
    customerPhone: string
    customerAddress: string
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleMileage: string
    vehicleVin: string
    vehicleLicensePlate: string
    notes: string
    statusTracker: any
}

function initializeFormData(workOrder: WorkOrderWithDetails | null, initialWorkOrder: any): WorkOrderFormData {
    if (!workOrder) {
        return {
            title: initialWorkOrder.title || "",
            description: initialWorkOrder.description || "",
            priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
            assignee: initialWorkOrder.assignee || "",
            date: initialWorkOrder.date || "",
            customer: initialWorkOrder.customer || "",
            vehicle: initialWorkOrder.vehicle || "",
            tags: initialWorkOrder.tags || [],
            customerEmail: "",
            customerPhone: "",
            customerAddress: "",
            vehicleYear: "",
            vehicleMake: "",
            vehicleModel: "",
            vehicleColor: "",
            vehicleMileage: "",
            vehicleVin: "",
            vehicleLicensePlate: "",
            notes: "",
            statusTracker: null,
        }
    }

    const isWalkIn = workOrder.customer_type === 'walk_in'

    return {
        title: workOrder.title || "",
        description: workOrder.description || "",
        priority: (workOrder.priority || "medium") as WorkOrderPriority,
        assignee: workOrder.technician
            ? `${workOrder.technician.first_name} ${workOrder.technician.last_name || ''}`
            : workOrder.assigned_technician_id || "",
        date: workOrder.created_at.split('T')[0] || "",
        customer: isWalkIn ? "Walk-in Customer" : (workOrder.customer?.customer_name || ""),
        vehicle: isWalkIn && workOrder.walk_in_vehicle_info
            ? `${workOrder.walk_in_vehicle_info.year} ${workOrder.walk_in_vehicle_info.make} ${workOrder.walk_in_vehicle_info.model}${workOrder.walk_in_vehicle_info.license_plate ? ` (${workOrder.walk_in_vehicle_info.license_plate})` : ''}`
            : workOrder.vehicle
                ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}${workOrder.vehicle.license_plate ? ` (${workOrder.vehicle.license_plate})` : ''}`
                : "",
        tags: workOrder.tags || [],
        customerEmail: isWalkIn ? "" : (workOrder.customer?.customer_email || ""),
        customerPhone: isWalkIn ? "" : (workOrder.customer?.customer_phone || ""),
        customerAddress: isWalkIn ? "" : (workOrder.customer?.customer_address || ""),
        vehicleYear: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.year?.toString() || ""
            : workOrder.vehicle?.year?.toString() || "",
        vehicleMake: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.make || ""
            : workOrder.vehicle?.make || "",
        vehicleModel: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.model || ""
            : workOrder.vehicle?.model || "",
        vehicleColor: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.color || ""
            : workOrder.vehicle?.color || "",
        vehicleMileage: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.mileage?.toString() || ""
            : workOrder.vehicle?.mileage?.toString() || "",
        vehicleVin: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.vin || ""
            : workOrder.vehicle?.vin || "",
        vehicleLicensePlate: isWalkIn && workOrder.walk_in_vehicle_info
            ? workOrder.walk_in_vehicle_info.license_plate || ""
            : workOrder.vehicle?.license_plate || "",
        notes: workOrder.notes || "",
        statusTracker: (() => {
            const tracker = workOrder.status_tracker
            if (!tracker) return null
            if (Array.isArray(tracker)) return tracker
            if (tracker && typeof tracker === 'object' && 'name' in tracker && 'color' in tracker) {
                return [tracker]
            }
            return null
        })(),
    }
}

export function useWorkOrderEditForm(
    workOrderDetails: WorkOrderWithDetails | null,
    initialWorkOrder: any
) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<WorkOrderFormData>(() =>
        initializeFormData(workOrderDetails, initialWorkOrder)
    )

    const updateWorkOrderMutation = useUpdateWorkOrder()
    const updateWorkOrderStatusMutation = useUpdateWorkOrderStatus()

    // Update form when work order details change
    useEffect(() => {
        if (workOrderDetails) {
            setFormData(initializeFormData(workOrderDetails, initialWorkOrder))
        }
    }, [workOrderDetails, initialWorkOrder])

    const canEdit = useCallback(() => {
        if (!workOrderDetails) return false
        return canEditWorkOrder(workOrderDetails.status)
    }, [workOrderDetails])

    const handleSave = useCallback(async (workOrderId: string) => {
        if (!canEdit()) {
            toast.error('This work order cannot be edited')
            return false
        }

        try {
            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    notes: formData.notes,
                    tags: formData.tags,
                    status_tracker: formData.statusTracker,
                },
            })

            toast.success('Work order updated successfully')
            setIsEditing(false)
            return true
        } catch (error: any) {
            console.error('Error updating work order:', error)
            toast.error(error.message || 'Failed to update work order')
            return false
        }
    }, [formData, canEdit, updateWorkOrderMutation])

    const handleFieldChange = useCallback((field: keyof WorkOrderFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }, [])

    return {
        isEditing,
        setIsEditing,
        formData,
        setFormData,
        handleFieldChange,
        canEdit: canEdit(),
        handleSave,
        updateWorkOrderMutation,
        updateWorkOrderStatusMutation,
    }
}

