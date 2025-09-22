// Service to convert Mia Insights upsell suggestions to work order items
import { UpsellSuggestion } from '../../ai/mia-insights/types/mia-insights'
import { WorkOrderItemsService } from './work-order-items-service'
import type { WorkOrderItemCreateData, WorkOrderItemType } from '../types/work-order-items'

export class UpsellToWorkItemService {
    /**
     * Convert an upsell suggestion to work order item data
     */
    static convertUpsellToWorkOrderItem(
        suggestion: UpsellSuggestion,
        workOrderId: string
    ): WorkOrderItemCreateData {
        // Determine item type based on suggestion category/content
        const itemType = this.determineItemType(suggestion)
        
        // Extract quantity if mentioned in description, default to 1
        const quantity = this.extractQuantity(suggestion.description) || 1
        
        // Calculate unit price from estimated value and quantity
        const unitPrice = suggestion.estimatedValue / quantity
        
        return {
            work_order_id: workOrderId,
            item_type: itemType,
            description: suggestion.title,
            quantity: quantity,
            unit_price: unitPrice,
            category: this.mapCategoryToWorkOrderCategory(suggestion.category),
            notes: suggestion.description,
            // For labor items, estimate labor hours based on estimated value and typical hourly rate
            labor_hours: itemType === 'labor' ? this.estimateLaborHours(suggestion.estimatedValue) : undefined,
        }
    }

    /**
     * Determine work order item type based on suggestion content
     */
    private static determineItemType(suggestion: UpsellSuggestion): WorkOrderItemType {
        const title = suggestion.title.toLowerCase()
        const description = suggestion.description.toLowerCase()
        const category = suggestion.category.toLowerCase()
        
        // Labor keywords
        if (
            title.includes('service') ||
            title.includes('inspection') ||
            title.includes('repair') ||
            title.includes('maintenance') ||
            title.includes('check') ||
            title.includes('flush') ||
            title.includes('tune-up') ||
            description.includes('labor') ||
            description.includes('hour') ||
            category.includes('service')
        ) {
            return 'labor'
        }
        
        // Parts keywords
        if (
            title.includes('replace') ||
            title.includes('filter') ||
            title.includes('oil') ||
            title.includes('brake') ||
            title.includes('tire') ||
            title.includes('battery') ||
            title.includes('belt') ||
            title.includes('hose') ||
            title.includes('fluid') ||
            title.includes('pad') ||
            title.includes('rotor') ||
            description.includes('part') ||
            description.includes('component')
        ) {
            return 'part'
        }
        
        // Service keywords (broader services)
        if (
            title.includes('package') ||
            title.includes('program') ||
            category.includes('preventive') ||
            category.includes('seasonal')
        ) {
            return 'service'
        }
        
        // Default to service for most upsells
        return 'service'
    }

    /**
     * Extract quantity from description text
     */
    private static extractQuantity(description: string): number | null {
        // Look for patterns like "4 tires", "2 filters", "set of 4", etc.
        const quantityPatterns = [
            /(\d+)\s*(tire|filter|pad|rotor|spark plug|bulb|belt|hose)/i,
            /set\s*of\s*(\d+)/i,
            /(\d+)\s*piece/i,
            /(\d+)\s*unit/i,
            /pair/i, // Special case for pair = 2
        ]
        
        for (const pattern of quantityPatterns) {
            const match = description.match(pattern)
            if (match) {
                if (pattern.source.includes('pair')) {
                    return 2
                }
                return parseInt(match[1], 10)
            }
        }
        
        return null
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
     * Assumes typical shop rate of $120-150/hour
     */
    private static estimateLaborHours(estimatedValue: number): number {
        const typicalHourlyRate = 135 // Average shop rate
        const estimatedHours = estimatedValue / typicalHourlyRate
        
        // Round to nearest 0.5 hour and ensure minimum of 0.5
        return Math.max(0.5, Math.round(estimatedHours * 2) / 2)
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
