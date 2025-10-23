import { WorkOrderItemsService } from '@/app/(features)/operations/lib/work-order-items-service'
import type { WorkOrderItem } from '@/app/(features)/operations/types/work-order-items'
import type { WorkOrderItemImport } from '../types/invoice-items'

/**
 * Convert work order items to invoice import format
 */
export async function getWorkOrderItemsForInvoice(
    workOrderId: string
): Promise<WorkOrderItemImport[]> {
    try {
        // Fetch work order items
        const workOrderItems = await WorkOrderItemsService.getWorkOrderItems(workOrderId)

        // Convert to invoice import format
        const invoiceImports: WorkOrderItemImport[] = workOrderItems.map((item: WorkOrderItem) => ({
            work_order_item_id: item.id,
            description: item.description,
            item_type: item.item_type,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            part_number: item.part_number || undefined,
            supplier: item.supplier || undefined,
            category: item.category || undefined,
            labor_hours: item.labor_hours || undefined,
            technician_id: item.technician_id || undefined,
            unit_cost: item.unit_cost || undefined,
            total_cost: item.total_cost || undefined,
        }))

        return invoiceImports
    } catch (error) {
        console.error('Failed to get work order items for invoice:', error)
        throw error
    }
}

/**
 * Calculate totals from work order items
 */
export function calculateWorkOrderItemsTotals(items: WorkOrderItem[]) {
    return items.reduce(
        (acc, item) => {
            acc.subtotal += item.total_price

            switch (item.item_type) {
                case 'part':
                    acc.partsTotal += item.total_price
                    break
                case 'labor':
                    acc.laborTotal += item.total_price
                    acc.laborHours += item.labor_hours || 0
                    break
                case 'service':
                    acc.servicesTotal += item.total_price
                    break
                case 'fee':
                    acc.feesTotal += item.total_price
                    break
                case 'discount':
                    acc.discountsTotal += item.total_price
                    break
                case 'package':
                    acc.packagesTotal += item.total_price
                    break
            }

            if (item.total_cost) {
                acc.totalCost += item.total_cost
            }

            return acc
        },
        {
            subtotal: 0,
            partsTotal: 0,
            laborTotal: 0,
            servicesTotal: 0,
            feesTotal: 0,
            discountsTotal: 0,
            packagesTotal: 0,
            laborHours: 0,
            totalCost: 0,
        }
    )
}

