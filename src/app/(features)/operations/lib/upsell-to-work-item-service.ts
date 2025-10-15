// Service to convert Mia Insights upsell suggestions to work order items
import { UpsellSuggestion } from '../../ai/mia-insights/types/mia-insights'
import { WorkOrderItemsService } from './work-order-items-service'
import type { WorkOrderItemCreateData, WorkOrderItemType } from '../types/work-order-items'

export class UpsellToWorkItemService {
    /**
     * Convert an upsell suggestion to work order item data
     * Always creates labor items with the specified structure
     */
    static convertUpsellToWorkOrderItem(
        suggestion: UpsellSuggestion,
        workOrderId: string
    ): WorkOrderItemCreateData {
        // Always create as labor item
        const itemType: WorkOrderItemType = 'labor'
        
        // Calculate labor hours and rate based on estimated value
        const laborHours = this.estimateLaborHours(suggestion.estimatedValue)
        const ratePerHour = suggestion.estimatedValue / laborHours
        
        const result = {
            work_order_id: workOrderId,
            item_type: itemType,
            description: suggestion.title,
            quantity: 1, // Labor items always have quantity of 1
            unit_price: ratePerHour, // Rate per hour
            category: this.mapCategoryToWorkOrderCategory(suggestion.category),
            notes: suggestion.description,
            labor_hours: laborHours,
            // technician_id left empty for user to choose
        }
        
        // Debug logging
        console.log('UpsellToWorkItemService - Converting upsell to work order item:', {
            suggestion: suggestion.title,
            itemType: result.item_type,
            laborHours: result.labor_hours,
            unitPrice: result.unit_price,
            totalValue: suggestion.estimatedValue
        })
        
        return result
    }



    /**
     * Map Mia category to work order category
     */
    private static mapCategoryToWorkOrderCategory(category: string): string {
        const categoryMap: Record<string, string> = {
            'immediate': 'Urgent Repairs',
            'preventive': 'Preventive Maintenance',
            'safety': 'Safety',
            'seasonal': 'Seasonal Maintenance',
            'high': 'Priority Repairs',
            'medium': 'Recommended Services',
            'low': 'Optional Services'
        }
        
        return categoryMap[category.toLowerCase()] || 'Recommended Services'
    }

    /**
     * Estimate labor hours based on estimated value
     * Uses a standard rate of $129.99/hour to match the example structure
     */
    private static estimateLaborHours(estimatedValue: number): number {
        const standardHourlyRate = 129.99 // Standard rate as per example
        const estimatedHours = estimatedValue / standardHourlyRate
        
        // Round to nearest 0.25 hour and ensure minimum of 0.25
        return Math.max(0.25, Math.round(estimatedHours * 4) / 4)
    }

    /**
     * Add upsell suggestion as work order item
     * Note: This method should be used with React Query mutations for automatic cache invalidation
     */
    static async addUpsellAsWorkOrderItem(
        suggestion: UpsellSuggestion,
        workOrderId: string
    ): Promise<WorkOrderItemCreateData> {
        const workOrderItemData = this.convertUpsellToWorkOrderItem(suggestion, workOrderId)
        return workOrderItemData
    }
}
