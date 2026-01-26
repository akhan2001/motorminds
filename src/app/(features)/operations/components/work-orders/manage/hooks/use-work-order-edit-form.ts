// Custom hook for work order form state management
import { useState, useEffect, useCallback, useRef } from 'react'
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
    
    // Use a ref to always have access to the latest formData in callbacks
    const formDataRef = useRef<WorkOrderFormData>(formData)
    
    // Keep ref in sync with state
    useEffect(() => {
        formDataRef.current = formData
    }, [formData, isEditing])

    const updateWorkOrderMutation = useUpdateWorkOrder()
    const updateWorkOrderStatusMutation = useUpdateWorkOrderStatus()

    // Track the work order ID to detect when switching between different work orders
    const [currentWorkOrderId, setCurrentWorkOrderId] = useState<string | null>(
        workOrderDetails?.id || null
    )
    
    // Track the last saved values to prevent resetting to stale data after save
    const lastSavedValuesRef = useRef<{ title: string; description: string } | null>(null)

    // Update form when work order details change - but only if NOT editing
    // This prevents overwriting user's unsaved changes while they're editing
    useEffect(() => {
        if (workOrderDetails) {
            const workOrderId = workOrderDetails.id
            
            // Reset form data if:
            // 1. We're switching to a different work order, OR
            // 2. We're not currently editing AND workOrderDetails matches what we last saved (server has updated)
            const isSwitchingWorkOrder = workOrderId !== currentWorkOrderId
            
            // Check if workOrderDetails matches what we last saved (meaning server has updated)
            const matchesLastSaved = lastSavedValuesRef.current && 
                workOrderDetails.title === lastSavedValuesRef.current.title &&
                workOrderDetails.description === lastSavedValuesRef.current.description
            
            // Only reset if:
            // - Switching work orders, OR
            // - Not editing AND (workOrderDetails matches last saved OR we haven't saved anything yet)
            const shouldReset = isSwitchingWorkOrder || (!isEditing && (matchesLastSaved || !lastSavedValuesRef.current))
            
            if (shouldReset) {
                const newFormData = initializeFormData(workOrderDetails, initialWorkOrder)
                setFormData(newFormData)
                setCurrentWorkOrderId(workOrderId)
                // Clear last saved values when switching work orders
                if (isSwitchingWorkOrder) {
                    lastSavedValuesRef.current = null
                }
            }
        }
    }, [workOrderDetails?.id, workOrderDetails?.title, workOrderDetails?.description, isEditing, currentWorkOrderId]) // Include title/description to detect actual changes

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
            // Use ref to get the absolute latest formData (avoids stale closure issues)
            const latestFormData = formDataRef.current
            
            const saveData = {
                title: latestFormData.title,
                description: latestFormData.description,
                priority: latestFormData.priority,
                notes: latestFormData.notes,
                tags: latestFormData.tags,
                status_tracker: latestFormData.statusTracker,
            }
            
            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: saveData,
            })

            // Store the values we just saved to prevent resetting to stale data
            lastSavedValuesRef.current = {
                title: saveData.title,
                description: saveData.description
            }

            toast.success('Work order updated successfully')
            setIsEditing(false)
            return true
        } catch (error: any) {
            console.error('Error updating work order:', error)
            toast.error(error.message || 'Failed to update work order')
            return false
        }
    }, [canEdit, updateWorkOrderMutation])

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

