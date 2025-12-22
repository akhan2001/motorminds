import { WorkOrderItemsService } from '../../work-order-items-service'
import type { WorkOrderItemCreateData } from '../../../types/work-order-items'

/**
 * Work Order Creation Service
 * Handles creation of work order items from various sources (templates, manual items, etc.)
 */
export class WorkOrderCreationService {
    /**
     * Create work order items from selected templates
     */
    static async createWorkOrderItemsFromTemplates(
        workOrderId: string,
        selectedTemplates: any[]
    ): Promise<void> {
        const itemPromises = selectedTemplates.map(async (template) => {
            const itemData: WorkOrderItemCreateData = {
                work_order_id: workOrderId,
                item_type: template.item_type,
                description: template.name, // Use template name as description
                part_number: template.part_number || undefined,
                quantity: template.selectedQuantity || template.quantity,
                unit_price: template.selectedUnitPrice || template.unit_price,
                unit_cost: template.unit_cost || undefined,
                supplier: template.supplier || undefined,
                category: template.category || undefined,
                warranty_period: template.warranty_period || undefined,
                notes: template.description || undefined, // Use template description as notes
                labor_hours: template.selectedLaborHours || template.labor_hours || undefined,
                technician_id: template.selectedTechnicianId || undefined,
            }

            return WorkOrderItemsService.createWorkOrderItem(itemData)
        })

        await Promise.all(itemPromises)
    }

    /**
     * Create work order items from labor items
     */
    static async createWorkOrderItemsFromLaborItems(
        workOrderId: string,
        laborItems: any[]
    ): Promise<void> {
        const itemPromises = laborItems.map(async (item) => {
            const itemData: WorkOrderItemCreateData = {
                work_order_id: workOrderId,
                item_type: 'labor' as const,
                description: item.description,
                quantity: 1, // Labor items typically have quantity of 1
                unit_price: item.unit_price,
                unit_cost: item.unit_cost || undefined,
                labor_hours: item.labor_hours,
                category: item.category || undefined,
                notes: item.notes || undefined,
                technician_id: item.technician_id || undefined,
            }

            return WorkOrderItemsService.createWorkOrderItem(itemData)
        })

        await Promise.all(itemPromises)
    }

    /**
     * Create work order items from parts items
     */
    static async createWorkOrderItemsFromPartsItems(
        workOrderId: string,
        partsItems: any[]
    ): Promise<void> {
        const itemPromises = partsItems.map(async (item) => {
            const itemData: WorkOrderItemCreateData = {
                work_order_id: workOrderId,
                item_type: 'part' as const,
                description: item.description,
                part_number: item.part_number || undefined,
                quantity: item.quantity,
                unit_price: item.unit_price,
                unit_cost: item.unit_cost || undefined,
                supplier: item.supplier || undefined,
                category: item.category || undefined,
                warranty_period: item.warranty_period || undefined,
                notes: item.notes || undefined,
            }

            return WorkOrderItemsService.createWorkOrderItem(itemData)
        })

        await Promise.all(itemPromises)
    }

    /**
     * Create work order items from generic items (services, fees, discounts, packages)
     */
    static async createWorkOrderItemsFromGenericItems(
        workOrderId: string,
        genericItems: any[],
        itemType: 'service' | 'fee' | 'discount' | 'package'
    ): Promise<void> {
        const itemPromises = genericItems.map(async (item) => {
            const itemData: WorkOrderItemCreateData = {
                work_order_id: workOrderId,
                item_type: itemType,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                unit_cost: item.unit_cost || undefined,
                category: item.category || undefined,
                labor_hours: item.labor_hours || undefined,
                notes: item.notes || undefined,
            }

            return WorkOrderItemsService.createWorkOrderItem(itemData)
        })

        await Promise.all(itemPromises)
    }

    /**
     * Create all work order items from work order data
     * Orchestrates creation of items from templates, labor, parts, and generic items
     * Returns the total count of items created
     */
    static async createAllWorkOrderItems(
        workOrderId: string,
        workOrderData: any
    ): Promise<number> {
        let totalItemsCreated = 0

        // Create work order items from selected templates
        if (workOrderData.selectedTemplates && workOrderData.selectedTemplates.length > 0) {
            try {
                await this.createWorkOrderItemsFromTemplates(workOrderId, workOrderData.selectedTemplates)
                totalItemsCreated += workOrderData.selectedTemplates.length
            } catch (error) {
                console.error('Failed to create work order items from templates:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from labor items
        if (workOrderData.laborItems && workOrderData.laborItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromLaborItems(workOrderId, workOrderData.laborItems)
                totalItemsCreated += workOrderData.laborItems.length
            } catch (error) {
                console.error('Failed to create work order items from labor items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from parts items
        if (workOrderData.partsItems && workOrderData.partsItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromPartsItems(workOrderId, workOrderData.partsItems)
                totalItemsCreated += workOrderData.partsItems.length
            } catch (error) {
                console.error('Failed to create work order items from parts items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from service items
        if (workOrderData.serviceItems && workOrderData.serviceItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromGenericItems(workOrderId, workOrderData.serviceItems, 'service')
                totalItemsCreated += workOrderData.serviceItems.length
            } catch (error) {
                console.error('Failed to create work order items from service items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from fee items
        if (workOrderData.feeItems && workOrderData.feeItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromGenericItems(workOrderId, workOrderData.feeItems, 'fee')
                totalItemsCreated += workOrderData.feeItems.length
            } catch (error) {
                console.error('Failed to create work order items from fee items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from discount items
        if (workOrderData.discountItems && workOrderData.discountItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromGenericItems(workOrderId, workOrderData.discountItems, 'discount')
                totalItemsCreated += workOrderData.discountItems.length
            } catch (error) {
                console.error('Failed to create work order items from discount items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        // Create work order items from package items
        if (workOrderData.packageItems && workOrderData.packageItems.length > 0) {
            try {
                await this.createWorkOrderItemsFromGenericItems(workOrderId, workOrderData.packageItems, 'package')
                totalItemsCreated += workOrderData.packageItems.length
            } catch (error) {
                console.error('Failed to create work order items from package items:', error)
                // Don't fail the entire operation if items creation fails
            }
        }

        return totalItemsCreated
    }
}

