'use client'

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { WorkOrderKanbanItem, WorkOrderPriority, WorkOrderWithDetails } from "../../../types/work-order"
import { useWorkOrderWithDetails, useUpdateWorkOrder, useUpdateWorkOrderStatus } from "../../../hooks/use-work-orders"
import { RevertWorkOrderDialog } from "../revert-work-order-dialog"
import { workOrderService } from "../../../lib/work-order-service"
import { useCanDeleteWorkOrders } from "../../../hooks/use-work-order-permissions"
import { useAuth } from "../../../hooks/use-auth"
import { Loader2 } from "lucide-react"
import {
    WorkOrderModalHeader,
    WorkOrderStatusBar,
    WorkOrderInformation,
    CustomerInformation,
    VehicleInformation,
    WorkOrderNotes,
    WorkOrderModalFooter,
    WorkOrderRightPanel,
    WorkOrderLaborItems,
    WorkOrderPartsItems,
    WorkOrderGenericItems
} from "../shared"
import { WorkOrderDeleteConfirmation } from "./work-order-delete-confirmation"
import { WorkOrderCostSummary } from "../complete"
import { WorkOrderItemCard } from "../../work-order-items/work-order-item-card"
import { SelectedTemplatesPanel } from "../../work-order-items/templates/selected-templates-panel"
import { WorkOrderItemTemplatesPanel } from "../../work-order-items/templates/work-order-item-templates-panel"
import type { WorkOrderItemTemplate } from "../../../types/work-order-item-templates"
import { WorkOrderItemsService } from "../../../lib/work-order-items-service"
import { getWorkOrderItems } from "../../../lib/work-order-items-service"
import { useWorkOrderItems } from "../../../hooks/use-work-order-items"
import { useCreateInvoiceFromWorkOrder } from "../../../../financials/hooks/use-invoices"
import { calculateInvoiceTotals } from "../../../../financials/lib/invoice-calculations"
import { PanelProvider } from "../../../contexts"
import { useWorkOrderInvoice } from "../../../hooks/use-work-order-invoice"
import { useRouter } from "next/navigation"

export interface WorkOrderEditModalProps {
    workOrder: WorkOrderKanbanItem
    onClose: () => void
    onSave?: (updated: WorkOrderKanbanItem, formData?: any) => void
    onDelete?: (workOrderId: string) => void
    className?: string
}

// Backwards compatibility type alias
export type WorkOrderDetailsModalProps = WorkOrderEditModalProps

interface SelectedTemplate extends WorkOrderItemTemplate {
    selectedQuantity?: number
    selectedUnitPrice?: number
    selectedLaborHours?: number
    selectedTechnicianId?: string
}

// Define labor and parts form item interfaces
interface LaborFormItem {
    id: string;
    description: string;
    labor_hours: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    technician_id?: string;
    active?: boolean; // true = accepted, false = declined, undefined = pending
}

interface PartFormItem {
    id: string;
    description: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    supplier?: string;
    category?: string;
    warranty_period?: string;
    notes?: string;
    active?: boolean; // true = accepted, false = declined, undefined = pending
}

interface GenericFormItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    active?: boolean; // true = accepted, false = declined, undefined = pending
}

export const WorkOrderEditModal: React.FC<WorkOrderEditModalProps> = ({
    workOrder: initialWorkOrder,
    onClose,
    onSave,
    onDelete,
    className = ""
}) => {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false)
    const [revertWarning, setRevertWarning] = useState<string | undefined>()
    const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([])
    const [laborItems, setLaborItems] = useState<LaborFormItem[]>([])
    const [partsItems, setPartsItems] = useState<PartFormItem[]>([])
    const [serviceItems, setServiceItems] = useState<GenericFormItem[]>([])
    const [feeItems, setFeeItems] = useState<GenericFormItem[]>([])
    const [discountItems, setDiscountItems] = useState<GenericFormItem[]>([])
    const [packageItems, setPackageItems] = useState<GenericFormItem[]>([])

    // Check permissions
    const { shopId } = useAuth()
    const { data: canDeleteWorkOrder = false, isLoading: isCheckingPermissions } = useCanDeleteWorkOrders(shopId || undefined)

    // Mock technician options (replace with actual data fetching if needed)
    const technicianOptions = [
        { id: 'tech-1', name: 'John Smith' },
        { id: 'tech-2', name: 'Jane Doe' },
        { id: 'tech-3', name: 'Mike Johnson' },
    ]

    // Fetch full work order details
    const { data: workOrderDetails, isLoading, error } = useWorkOrderWithDetails(initialWorkOrder.id)

    // Fetch work order items for cost summary
    const { data: workOrderItems = [] } = useWorkOrderItems(initialWorkOrder.id)

    // Check if work order has an invoice
    const { data: workOrderInvoice } = useWorkOrderInvoice(initialWorkOrder.id)

    // Update work order mutation
    const updateWorkOrderMutation = useUpdateWorkOrder()
    const updateWorkOrderStatusMutation = useUpdateWorkOrderStatus()

    // Form state for editing
    const [formData, setFormData] = useState({
        title: initialWorkOrder.title || "",
        description: initialWorkOrder.description || "",
        priority: (initialWorkOrder.priority || "medium") as WorkOrderPriority,
        assignee: initialWorkOrder.assignee || "",
        date: initialWorkOrder.date || "",
        customer: initialWorkOrder.customer || "",
        vehicle: initialWorkOrder.vehicle || "",
        tags: initialWorkOrder.tags || [],

        // Additional fields for comprehensive display
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",

        // Vehicle details (expanded from vehicle string)
        vehicleYear: "",
        vehicleMake: "",
        vehicleModel: "",
        vehicleColor: "",
        vehicleMileage: "",
        vehicleVin: "",
        vehicleLicensePlate: "",

        // Work order specifics
        notes: "",
        // Normalize status_tracker to array (handle both old format single object and new format array)
        statusTracker: (() => {
            const tracker = initialWorkOrder.status_tracker
            if (!tracker) return null
            if (Array.isArray(tracker)) return tracker
            // Handle old format: single object
            if (tracker && typeof tracker === 'object' && 'name' in tracker && 'color' in tracker) {
                return [tracker]
            }
            return null
        })(),
    })

    // Update form when work order details are fetched
    useEffect(() => {
        if (workOrderDetails) {
            // Handle walk-in customers
            const isWalkIn = workOrderDetails.customer_type === 'walk_in'

            setFormData(prev => ({
                ...prev,
                title: workOrderDetails.title || "",
                description: workOrderDetails.description || "",
                priority: (workOrderDetails.priority || "medium") as WorkOrderPriority,
                assignee: workOrderDetails.technician
                    ? `${workOrderDetails.technician.first_name} ${workOrderDetails.technician.last_name || ''}`
                    : workOrderDetails.assigned_technician_id || "",
                date: workOrderDetails.created_at.split('T')[0] || "",
                customer: isWalkIn ? "Walk-in Customer" : (workOrderDetails.customer?.customer_name || ""),
                vehicle: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? `${workOrderDetails.walk_in_vehicle_info.year} ${workOrderDetails.walk_in_vehicle_info.make} ${workOrderDetails.walk_in_vehicle_info.model}${workOrderDetails.walk_in_vehicle_info.license_plate ? ` (${workOrderDetails.walk_in_vehicle_info.license_plate})` : ''}`
                    : workOrderDetails.vehicle
                        ? `${workOrderDetails.vehicle.year} ${workOrderDetails.vehicle.make} ${workOrderDetails.vehicle.model}${workOrderDetails.vehicle.license_plate ? ` (${workOrderDetails.vehicle.license_plate})` : ''}`
                        : "",
                tags: workOrderDetails.tags || [],

                // Customer details
                customerEmail: isWalkIn ? "" : (workOrderDetails.customer?.customer_email || ""),
                customerPhone: isWalkIn ? "" : (workOrderDetails.customer?.customer_phone || ""),
                customerAddress: isWalkIn ? "" : (workOrderDetails.customer?.customer_address || ""),

                // Vehicle details - use walk-in info if available
                vehicleYear: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.year?.toString() || ""
                    : workOrderDetails.vehicle?.year?.toString() || "",
                vehicleMake: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.make || ""
                    : workOrderDetails.vehicle?.make || "",
                vehicleModel: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.model || ""
                    : workOrderDetails.vehicle?.model || "",
                vehicleColor: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.color || ""
                    : workOrderDetails.vehicle?.color || "",
                vehicleMileage: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.mileage?.toString() || ""
                    : workOrderDetails.vehicle?.mileage?.toString() || "",
                vehicleVin: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.vin || ""
                    : workOrderDetails.vehicle?.vin || "",
                vehicleLicensePlate: isWalkIn && workOrderDetails.walk_in_vehicle_info
                    ? workOrderDetails.walk_in_vehicle_info.license_plate || ""
                    : workOrderDetails.vehicle?.license_plate || "",

                // Work order notes
                notes: workOrderDetails.notes || "",
                // Normalize status_tracker to array (handle both old format single object and new format array)
                statusTracker: (() => {
                    const tracker = workOrderDetails.status_tracker
                    if (!tracker) return null
                    if (Array.isArray(tracker)) return tracker
                    // Handle old format: single object
                    if (tracker && typeof tracker === 'object' && 'name' in tracker && 'color' in tracker) {
                        return [tracker]
                    }
                    return null
                })(),
            }))
        }
    }, [workOrderDetails])

    // Populate labor and parts items from fetched work order items
    useEffect(() => {
        if (workOrderItems && workOrderItems.length > 0) {
            // Debug logging
            console.log('WorkOrderEditModal - Processing work order items:', workOrderItems.map(item => ({
                id: item.id,
                description: item.description,
                item_type: item.item_type,
                labor_hours: item.labor_hours,
                unit_price: item.unit_price,
                active: item.active
            })))

            // Separate items by type
            const labor: LaborFormItem[] = []
            const parts: PartFormItem[] = []
            const services: GenericFormItem[] = []
            const fees: GenericFormItem[] = []
            const discounts: GenericFormItem[] = []
            const packages: GenericFormItem[] = []

            workOrderItems.forEach(item => {
                console.log('WorkOrderEditModal - Processing item:', {
                    id: item.id,
                    description: item.description,
                    item_type: item.item_type,
                    active: item.active
                })

                if (item.item_type === 'labor') {
                    labor.push({
                        id: item.id,
                        description: item.description,
                        labor_hours: item.labor_hours || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.labor_hours || 1) * (item.unit_price || 0),
                        notes: item.notes || '',
                        technician_id: item.technician_id || '',
                        active: item.active
                    })
                } else if (item.item_type === 'part') {
                    parts.push({
                        id: item.id,
                        description: item.description,
                        part_number: item.part_number || '',
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.quantity || 1) * (item.unit_price || 0),
                        supplier: item.supplier || '',
                        category: item.category || '',
                        warranty_period: item.warranty_period || '',
                        notes: item.notes || '',
                        active: item.active
                    })
                } else if (item.item_type === 'service') {
                    services.push({
                        id: item.id,
                        description: item.description,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.quantity || 1) * (item.unit_price || 0),
                        notes: item.notes || '',
                        active: item.active
                    })
                } else if (item.item_type === 'fee') {
                    fees.push({
                        id: item.id,
                        description: item.description,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.quantity || 1) * (item.unit_price || 0),
                        notes: item.notes || '',
                        active: item.active
                    })
                } else if (item.item_type === 'discount') {
                    discounts.push({
                        id: item.id,
                        description: item.description,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.quantity || 1) * (item.unit_price || 0),
                        notes: item.notes || '',
                        active: item.active
                    })
                } else if (item.item_type === 'package') {
                    packages.push({
                        id: item.id,
                        description: item.description,
                        quantity: item.quantity || 1,
                        unit_price: item.unit_price || 0,
                        total_price: (item.quantity || 1) * (item.unit_price || 0),
                        notes: item.notes || '',
                        active: item.active
                    })
                }
            })

            setLaborItems(labor)
            setPartsItems(parts)
            setServiceItems(services)
            setFeeItems(fees)
            setDiscountItems(discounts)
            setPackageItems(packages)
        }
    }, [workOrderItems])

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Handle technician assignment with immediate save
    const handleTechnicianSelect = async (technicianId: string, technicianData?: any) => {
        try {
            // Update local form state
            if (technicianId === "none") {
                setFormData(prev => ({
                    ...prev,
                    assignee: "",
                }))
            } else if (technicianData) {
                setFormData(prev => ({
                    ...prev,
                    assignee: technicianData.fullName,
                }))
            }

            // Immediately save to database
            await updateWorkOrderMutation.mutateAsync({
                id: initialWorkOrder.id,
                data: {
                    assigned_technician_id: technicianId === "none" ? undefined : technicianId
                }
            })

            toast.success('Technician assignment updated successfully')
        } catch (error) {
            console.error('Failed to update technician assignment:', error)
            toast.error('Failed to update technician assignment')

            // Revert local state on error
            setFormData(prev => ({
                ...prev,
                assignee: workOrderDetails?.technician
                    ? `${workOrderDetails.technician.first_name} ${workOrderDetails.technician.last_name || ''}`
                    : workOrderDetails?.assigned_technician_id || "",
            }))
        }
    }

    const handleAddTag = (newTag: string) => {
        if (newTag && !formData.tags.includes(newTag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag]
            }))
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    // Template selection handlers
    const handleTemplateSelect = (template: WorkOrderItemTemplate) => {
        // Check if template is already selected
        const isAlreadySelected = selectedTemplates.some(selected => selected.id === template.id)

        if (isAlreadySelected) {
            // Template already selected, don't add it again
            toast.info('Template already selected')
            return
        }

        // Add to selected templates
        const selectedTemplate: SelectedTemplate = {
            ...template,
            selectedQuantity: template.quantity,
            selectedUnitPrice: template.unit_price,
            selectedLaborHours: template.labor_hours
        }
        setSelectedTemplates(prev => [...prev, selectedTemplate])

        // Auto-populate the appropriate items list based on template type
        if (template.item_type === 'labor') {
            // Add to labor items
            const newLaborItem: LaborFormItem = {
                id: uuidv4(),
                description: template.name,
                labor_hours: template.labor_hours || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.labor_hours || 1) * (template.unit_price || 0),
                notes: template.description || '',
                technician_id: ''
            }
            setLaborItems(prev => [...prev, newLaborItem])
            toast.success(`Labor template "${template.name}" added to items`)
        } else if (template.item_type === 'part') {
            // Add to parts items
            const newPartItem: PartFormItem = {
                id: uuidv4(),
                description: template.name,
                part_number: template.part_number || '',
                quantity: template.quantity || 1,
                unit_price: template.unit_price || 0,
                total_price: (template.quantity || 1) * (template.unit_price || 0),
                supplier: template.supplier || '',
                category: template.category || '',
                warranty_period: template.warranty_period || '',
                notes: template.description || ''
            }
            setPartsItems(prev => [...prev, newPartItem])
            toast.success(`Part template "${template.name}" added to items`)
        }
    }

    const handleRemoveTemplate = (templateId: string) => {
        setSelectedTemplates(prev => prev.filter(template => template.id !== templateId))
    }

    const handleUpdateTemplate = (templateId: string, updates: Partial<SelectedTemplate>) => {
        setSelectedTemplates(prev =>
            prev.map(template =>
                template.id === templateId
                    ? { ...template, ...updates }
                    : template
            )
        )
    }

    // Labor items handlers
    const handleLaborItemsChange = (items: LaborFormItem[]) => {
        setLaborItems(items)

        // Update selected templates - remove any templates that no longer have corresponding items
        // This ensures the green highlight is removed when items are deleted
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'labor' || itemDescriptions.includes(template.name)
        ))
    }

    const handleLaborItemSaved = (item: any) => {
        // Handle successful save of individual labor item
        toast.success(`Labor item "${item.description}" saved successfully`)
        // Optionally refresh work order items list
    }

    // Parts items handlers
    const handlePartsItemsChange = (items: PartFormItem[]) => {
        setPartsItems(items)

        // Update selected templates - remove any templates that no longer have corresponding items
        // This ensures the green highlight is removed when items are deleted
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'part' || itemDescriptions.includes(template.name)
        ))
    }

    const handlePartItemSaved = (item: any) => {
        // Handle successful save of individual part item
        toast.success(`Part item "${item.description}" saved successfully`)
        // Optionally refresh work order items list
    }

    // Generic items handlers
    const handleServiceItemsChange = (items: GenericFormItem[]) => {
        setServiceItems(items)
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'service' || itemDescriptions.includes(template.name)
        ))
    }

    const handleFeeItemsChange = (items: GenericFormItem[]) => {
        setFeeItems(items)
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'fee' || itemDescriptions.includes(template.name)
        ))
    }

    const handleDiscountItemsChange = (items: GenericFormItem[]) => {
        setDiscountItems(items)
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'discount' || itemDescriptions.includes(template.name)
        ))
    }

    const handlePackageItemsChange = (items: GenericFormItem[]) => {
        setPackageItems(items)
        const itemDescriptions = items.map(item => item.description)
        setSelectedTemplates(prev => prev.filter(template =>
            template.item_type !== 'package' || itemDescriptions.includes(template.name)
        ))
    }

    const handleGenericItemSaved = (item: any) => {
        toast.success(`${item.item_type} item "${item.description}" saved successfully`)
    }

    // Function to add selected templates as work order items
    const handleAddTemplatesAsItems = async () => {
        if (selectedTemplates.length === 0) return

        try {
            const workOrderId = workOrderDetails?.id || initialWorkOrder.id

            // Create work order items from selected templates
            const itemPromises = selectedTemplates.map(async (template) => {
                const itemData = {
                    work_order_id: workOrderId,
                    item_type: template.item_type,
                    description: template.name,
                    part_number: template.part_number,
                    quantity: template.selectedQuantity || template.quantity,
                    unit_price: template.selectedUnitPrice || template.unit_price,
                    unit_cost: template.unit_cost,
                    supplier: template.supplier,
                    category: template.category,
                    warranty_period: template.warranty_period,
                    notes: template.description,
                    labor_hours: template.selectedLaborHours || template.labor_hours,
                    technician_id: template.selectedTechnicianId,
                }

                return WorkOrderItemsService.createWorkOrderItem(itemData)
            })

            await Promise.all(itemPromises)

            // Clear selected templates after adding them
            setSelectedTemplates([])

            toast.success(`${selectedTemplates.length} items added to work order`)
        } catch (error) {
            console.error('Failed to add templates as items:', error)
            toast.error('Failed to add items to work order')
        }
    }

    const handleSave = async () => {
        const workOrderId = workOrderDetails?.id || initialWorkOrder.id

        // Prepare the update data for the mutation
        const updateData = {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            notes: formData.notes,
            tags: formData.tags,
            status_tracker: formData.statusTracker,
        }

        try {
            // First save all work order items
            await saveAllItems()

            // Then update the work order
            await updateWorkOrderMutation.mutateAsync({
                id: workOrderId,
                data: updateData
            })

            // Also call the parent onSave callback if provided (for any additional logic)
            const updatedWorkOrder: WorkOrderKanbanItem = {
                ...initialWorkOrder,
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                assignee: formData.assignee,
                date: formData.date,
                customer: formData.customer,
                vehicle: formData.vehicle,
                tags: formData.tags,
                status_tracker: formData.statusTracker,
            }
            updatedWorkOrder.id = workOrderId

            await onSave?.(updatedWorkOrder, formData)

            setIsEditing(false)
            toast.success("Work order and items updated successfully")
        } catch (error) {
            console.error('Error saving work order:', error)
            toast.error("Failed to update work order")
        }
    }

    const handleDelete = () => {
        if (!canDeleteWorkOrder) {
            toast.error('You do not have permission to archive work orders. Only admins and shop owners can archive work orders.')
            return
        }
        if (canDelete()) {
            setIsDeleteConfirmationOpen(true)
        } else {
            const status = workOrderDetails?.status || initialWorkOrder.status
            toast.error(`Invoiced work orders cannot be archived due to financial record requirements`)
        }
    }

    const handleDeleteConfirm = () => {
        onDelete?.(initialWorkOrder.id)
        setIsDeleteConfirmationOpen(false)
        onClose()
    }

    const handleDeleteCancel = () => {
        setIsDeleteConfirmationOpen(false)
    }

    // Handle modal close with auto-save
    const handleModalClose = async () => {
        try {
            // Save any unsaved items before closing
            await saveAllItems()
            onClose()
        } catch (error) {
            console.error('Error saving items on close:', error)
            // Still close the modal even if save fails
            onClose()
        }
    }

    // Save all labor and parts items when saving work order
    const saveAllItems = async () => {
        try {
            const workOrderId = workOrderDetails?.id || initialWorkOrder.id
            if (!workOrderId) return

            // Get existing work order items to determine which are new vs existing
            const existingItems = await WorkOrderItemsService.getWorkOrderItems(workOrderId)
            const existingItemIds = new Set(existingItems.map(item => item.id))

            // Save all labor items
            for (const item of laborItems) {
                if (item.description.trim()) {
                    try {
                        if (existingItemIds.has(item.id)) {
                            // Update existing item
                            console.log('Updating existing labor item:', item.id)
                            await WorkOrderItemsService.updateWorkOrderItem(item.id, {
                                description: item.description,
                                labor_hours: item.labor_hours,
                                unit_price: item.unit_price,
                                notes: item.notes,
                                technician_id: item.technician_id,
                                active: item.active
                            })
                        } else {
                            // Create new item
                            console.log('Creating new labor item:', item.id)
                            await WorkOrderItemsService.createWorkOrderItem({
                                work_order_id: workOrderId,
                                item_type: 'labor',
                                description: item.description,
                                quantity: 1, // Labor items typically have quantity of 1
                                unit_price: item.unit_price,
                                labor_hours: item.labor_hours,
                                notes: item.notes,
                                technician_id: item.technician_id,
                            })
                        }
                    } catch (error) {
                        console.error(`Error saving labor item ${item.id}:`, error)
                        throw error
                    }
                }
            }

            // Save all parts items
            for (const item of partsItems) {
                if (item.description.trim()) {
                    try {
                        if (existingItemIds.has(item.id)) {
                            // Update existing item
                            console.log('Updating existing parts item:', item.id)
                            await WorkOrderItemsService.updateWorkOrderItem(item.id, {
                                description: item.description,
                                part_number: item.part_number,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                supplier: item.supplier,
                                category: item.category,
                                warranty_period: item.warranty_period,
                                notes: item.notes,
                                active: item.active
                            })
                        } else {
                            // Create new item
                            console.log('Creating new parts item:', item.id)
                            await WorkOrderItemsService.createWorkOrderItem({
                                work_order_id: workOrderId,
                                item_type: 'part',
                                description: item.description,
                                part_number: item.part_number,
                                quantity: item.quantity,
                                unit_price: item.unit_price,
                                supplier: item.supplier,
                                category: item.category,
                                warranty_period: item.warranty_period,
                                notes: item.notes,
                            })
                        }
                    } catch (error) {
                        console.error(`Error saving parts item ${item.id}:`, error)
                        throw error
                    }
                }
            }

            console.log('All work order items saved successfully')
        } catch (error) {
            console.error('Error saving work order items:', error)
            toast.error('Failed to save some work order items')
            throw error // Re-throw to prevent work order save if items fail
        }
    }

    const createInvoiceMutation = useCreateInvoiceFromWorkOrder()

    const handleGenerateInvoice = async () => {
        try {
            const workOrderId = workOrderDetails?.id || initialWorkOrder.id
            const shopId = workOrderDetails?.shop_id || ''

            if (!workOrderId) {
                toast.error('Work order ID is missing')
                return
            }

            if (!shopId) {
                toast.error('Shop ID is missing')
                return
            }

            console.log('Generating invoice for work order:', {
                workOrderId,
                shopId,
                customerId: workOrderDetails?.customer_id,
                vehicleId: workOrderDetails?.vehicle_id
            })

            // Use the new invoice system
            const newInvoice = await createInvoiceMutation.mutateAsync({
                work_order_id: workOrderId,
                shop_id: shopId
            })

            if (newInvoice) {
                console.log('Invoice created:', newInvoice)

                // Show success message with option to view invoice
                toast.success(
                    `Invoice ${newInvoice.display_id || newInvoice.invoice_number} generated successfully!`,
                    {
                        action: {
                            label: 'View Invoice',
                            onClick: () => router.push('/financials/invoices')
                        },
                        duration: 5000
                    }
                )
            }

        } catch (error: any) {
            console.error('Error generating invoice:', error)
            console.error('Error details:', {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code
            })

            const errorMessage = error?.message || 'Failed to generate invoice. Please try again.'
            toast.error(errorMessage)
        }
    }

    const handleGoToInvoice = () => {
        if (workOrderInvoice) {
            router.push('/financials/invoices')
        }
    }

    // Check if work order can be edited based on status
    const canEdit = () => {
        const status = workOrderDetails?.status || initialWorkOrder.status
        // Allow editing for: pending, approved, in_progress, waiting_parts, waiting_customer, on_hold, completed
        // Disable editing for: invoiced, cancelled
        return status !== 'invoiced' && status !== 'cancelled'
    }

    // Check if work order can be deleted based on status AND permissions
    const canDelete = () => {
        const status = workOrderDetails?.status || initialWorkOrder.status
        // Check permission first
        if (!canDeleteWorkOrder) {
            return false
        }
        // Then check status - don't allow deletion of invoiced work orders (due to financial/legal reasons)
        if (!status) return true // Default to allowing deletion if status is unclear

        const canDeleteResult = status !== 'invoiced'
        // console.log('Delete check - Status:', status, 'Can delete:', canDeleteResult, 'Has permission:', canDeleteWorkOrder)

        return canDeleteResult
    }

    const getDeleteDisabledReason = () => {
        if (!canDeleteWorkOrder) {
            return "Only admins and shop owners can archive work orders."
        }
        const status = workOrderDetails?.status || initialWorkOrder.status
        if (status === 'invoiced') {
            return "Invoiced work orders cannot be archived due to financial record requirements"
        }
        return undefined
    }

    const handleEdit = () => {
        if (canEdit()) {
            setIsEditing(true)
        } else {
            const status = workOrderDetails?.status || initialWorkOrder.status
            const statusName = status === 'invoiced' ? 'invoiced' : 'cancelled'
            toast.error(`${statusName.charAt(0).toUpperCase() + statusName.slice(1)} work orders cannot be edited`)
        }
    }

    const handleDeleteClick = () => {
        if (!canDeleteWorkOrder) {
            toast.error('You do not have permission to archive work orders. Only admins and shop owners can archive work orders.')
            return
        }
        setIsDeleteConfirmationOpen(true)
    }

    const handleRevertClick = async () => {
        const status = workOrderDetails?.status || initialWorkOrder.status
        if (status !== 'completed') {
            toast.error('Only completed work orders can be reverted')
            return
        }

        // Check if revert is allowed
        const canRevert = await workOrderService.canRevertFromCompleted(initialWorkOrder.id)

        if (!canRevert.canRevert) {
            toast.error(canRevert.reason || 'Cannot revert this work order')
            return
        }

        setRevertWarning(canRevert.reason)
        setIsRevertDialogOpen(true)
    }

    const handleRevertConfirm = async () => {
        try {
            await updateWorkOrderStatusMutation.mutateAsync({
                id: initialWorkOrder.id,
                status: 'in_progress'
            })

            toast.success('Work order reverted to In Progress')
            setIsRevertDialogOpen(false)
            setRevertWarning(undefined)

            // Refresh work order details
            if (onSave) {
                // Trigger a refetch by calling onSave with updated status
                const updatedWorkOrder = { ...initialWorkOrder, status: 'in_progress' as any }
                onSave(updatedWorkOrder)
            }
        } catch (error) {
            console.error('Failed to revert work order:', error)
            toast.error('Failed to revert work order')
        }
    }

    const handleRevertCancel = () => {
        setIsRevertDialogOpen(false)
        setRevertWarning(undefined)
    }

    const handleCancel = () => setIsEditing(false)

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg p-8 flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading work order details...</span>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg p-8 text-center">
                    <p className="text-red-500 dark:text-red-400 mb-4">Failed to load work order details</p>
                    <button
                        onClick={handleModalClose}
                        className="px-4 py-2 bg-secondary dark:bg-gray-600 hover:bg-accent dark:hover:bg-gray-700 rounded text-foreground dark:text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    // Don't render if no data yet
    if (!workOrderDetails) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center overflow-hidden">
            <div className="bg-popover dark:bg-[#131313] text-popover-foreground dark:text-white border-border rounded-lg shadow-lg flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]">
                <ResizablePanelGroup direction="horizontal" className="w-full h-full">
                    {/* Main Content Panel */}
                    <ResizablePanel defaultSize={60} minSize={50} maxSize={70}>
                        <div className="flex flex-col h-full min-h-0">
                            {/* Header */}
                            <WorkOrderModalHeader
                                workOrder={initialWorkOrder}
                                workOrderDetails={workOrderDetails}
                                onClose={handleModalClose}
                                onRevert={handleRevertClick}
                            />

                            {/* Status Bar */}
                            <WorkOrderStatusBar
                                priority={formData.priority}
                                date={formData.date}
                                startedAt={workOrderDetails.started_at}
                                assignee={formData.assignee}
                                status={workOrderDetails.status}
                            />

                            {/* Edit Restriction Notice */}
                            {!canEdit() && (
                                <div className="mx-6 my-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.464 0L4.35 16.5c-.77.833-.192 2.5 1.348 2.5z" />
                                        </svg>
                                        This work order cannot be edited because it has been {workOrderDetails?.status || initialWorkOrder.status}.
                                    </p>
                                </div>
                            )}

                            {/* Main Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                <div
                                    className={`p-6 space-y-6 ${!canEdit() ? 'pointer-events-none opacity-90' : ''}`}
                                    onClick={() => {
                                        if (!canEdit() && !isEditing) {
                                            const status = workOrderDetails?.status || initialWorkOrder.status
                                            toast.error(`This work order cannot be edited because it has been ${status}`)
                                        }
                                    }}
                                >

                                    {/* Customer Information */}
                                    <CustomerInformation
                                        customerId={""} // Not used in details view
                                        customerName={formData.customer}
                                        customerEmail={formData.customerEmail}
                                        customerPhone={formData.customerPhone}
                                        customerAddress={formData.customerAddress}
                                        isEditing={isEditing}
                                        onFieldChange={handleFieldChange}
                                    />

                                    {/* Vehicle Information */}
                                    <VehicleInformation
                                        vehicleId={workOrderDetails.vehicle_id || ""}
                                        vehicleYear={formData.vehicleYear}
                                        vehicleMake={formData.vehicleMake}
                                        vehicleModel={formData.vehicleModel}
                                        vehicleColor={formData.vehicleColor}
                                        vehicleVin={formData.vehicleVin}
                                        vehicleLicensePlate={formData.vehicleLicensePlate}
                                        vehicleMileage={formData.vehicleMileage}
                                        isEditing={isEditing}
                                        onFieldChange={handleFieldChange}
                                    />
                                    {/* Work Order Information */}
                                    <WorkOrderInformation
                                        title={formData.title}
                                        description={formData.description}
                                        priority={formData.priority}
                                        assignee={formData.assignee}
                                        assigneeId={workOrderDetails?.assigned_technician_id || ""}
                                        date={formData.date}
                                        tags={formData.tags}
                                        isEditing={isEditing}
                                        isCreating={false}
                                        onFieldChange={handleFieldChange}
                                        onTechnicianSelect={handleTechnicianSelect}
                                        onAddTag={handleAddTag}
                                        onRemoveTag={handleRemoveTag}
                                    />

                                    {/* Cost Summary - Only show for completed work orders */}
                                    {workOrderDetails?.status === 'completed' && workOrderItems.length > 0 && (
                                        <div className="mt-6">
                                            <WorkOrderCostSummary
                                                workOrderItems={workOrderItems}
                                            />
                                        </div>
                                    )}

                                    {/* Work Order Items - Show for in-progress work orders (Editable) */}
                                    {workOrderDetails?.status !== 'completed' && (
                                        <div className="bg-slate-50 dark:bg-[#131313] border border-border dark:border-[#333333] rounded-lg mt-6">
                                            <div className="p-4">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Work Order Items</h3>
                                                </div>

                                                {/* Labor Items */}
                                                <div className="mb-6">
                                                    <WorkOrderLaborItems
                                                        items={laborItems}
                                                        onItemsChange={handleLaborItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        technicianOptions={technicianOptions}
                                                        onItemSaved={handleLaborItemSaved}
                                                        isEditing={isEditing}
                                                    />
                                                </div>

                                                {/* Parts Items */}
                                                <div className="mb-6">
                                                    <WorkOrderPartsItems
                                                        items={partsItems}
                                                        onItemsChange={handlePartsItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        onItemSaved={handlePartItemSaved}
                                                        isEditing={isEditing}
                                                    />
                                                </div>

                                                {/* Service Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={serviceItems}
                                                        onItemsChange={handleServiceItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={isEditing}
                                                        itemType="service"
                                                        title="Services"
                                                    />
                                                </div>

                                                {/* Fee Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={feeItems}
                                                        onItemsChange={handleFeeItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={isEditing}
                                                        itemType="fee"
                                                        title="Fees"
                                                    />
                                                </div>

                                                {/* Discount Items */}
                                                <div className="mb-6">
                                                    <WorkOrderGenericItems
                                                        items={discountItems}
                                                        onItemsChange={handleDiscountItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={isEditing}
                                                        itemType="discount"
                                                        title="Discounts"
                                                    />
                                                </div>

                                                {/* Package Items */}
                                                <div>
                                                    <WorkOrderGenericItems
                                                        items={packageItems}
                                                        onItemsChange={handlePackageItemsChange}
                                                        workOrderId={initialWorkOrder.id}
                                                        onItemSaved={handleGenericItemSaved}
                                                        isEditing={isEditing}
                                                        itemType="package"
                                                        title="Packages"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <WorkOrderNotes
                                        notes={formData.notes}
                                        isEditing={isEditing}
                                        onFieldChange={handleFieldChange}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <WorkOrderModalFooter
                                isEditing={isEditing}
                                canEdit={canEdit()}
                                canDelete={canDelete()}
                                canGenerateInvoice={(workOrderDetails?.status === 'completed' || initialWorkOrder.status === 'completed')}
                                workOrderStatus={workOrderDetails?.status || initialWorkOrder.status}
                                hasInvoice={!!workOrderInvoice}
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onClose={onClose}
                                onDelete={onDelete ? handleDelete : undefined}
                                onGenerateInvoice={handleGenerateInvoice}
                                onGoToInvoice={handleGoToInvoice}
                                deleteDisabledReason={getDeleteDisabledReason()}
                            />
                        </div>
                    </ResizablePanel>

                    {/* Resizable Handle */}
                    <ResizableHandle withHandle />

                    {/* Right Panel */}
                    <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
                        <WorkOrderRightPanel
                            workOrderId={initialWorkOrder.id}
                            shopId={initialWorkOrder.shop_id}
                            workOrderStatus={initialWorkOrder.status}
                            customerId={workOrderDetails?.customer_id}
                            customerType={workOrderDetails?.customer_type}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Delete Confirmation Dialog */}
            <WorkOrderDeleteConfirmation
                workOrder={initialWorkOrder}
                isOpen={isDeleteConfirmationOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
            />

            <RevertWorkOrderDialog
                isOpen={isRevertDialogOpen}
                onClose={handleRevertCancel}
                onConfirm={handleRevertConfirm}
                workOrderTitle={workOrderDetails?.title || initialWorkOrder.title}
                hasInvoice={!!workOrderDetails?.invoice_id}
                warningMessage={revertWarning}
                isReverting={updateWorkOrderStatusMutation.isPending}
            />
        </div>
    )
}

// Backwards compatibility export
export const WorkOrderDetailsModal = WorkOrderEditModal
