import { v4 as uuidv4 } from 'uuid'
import type { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'
import type {
    LaborFormItem,
    PartFormItem,
    ExpenseFormItem,
    GenericFormItem,
    SelectedTemplate,
    WorkOrderItemsByType
} from '../../../types/work-order-item-forms'

/**
 * Template-to-Item Converter
 * Converts work order item templates to form items for different item types
 * Eliminates duplicated template conversion logic across create and edit modals
 */

// Re-export for backwards compatibility
export type { LaborFormItem, PartFormItem, ExpenseFormItem, GenericFormItem, SelectedTemplate }

export interface ConvertedItems extends WorkOrderItemsByType {}

/**
 * Template-to-Item Converter Class
 * Provides static methods for converting templates to form items
 */
export class TemplateToItemConverter {
    /**
     * Convert a single template to a labor form item
     */
    static templateToLaborItem(template: SelectedTemplate): LaborFormItem {
        const laborHours = template.selectedLaborHours ?? template.labor_hours ?? 1
        const unitPrice = template.selectedUnitPrice ?? template.unit_price ?? 0

        return {
            id: uuidv4(),
            description: template.name,
            labor_hours: laborHours,
            unit_price: unitPrice,
            total_price: laborHours * unitPrice,
            notes: template.description || '',
            technician_id: template.selectedTechnicianId || ''
        }
    }

    /**
     * Convert a single template to a part form item
     */
    static templateToPartItem(template: SelectedTemplate): PartFormItem {
        const quantity = template.selectedQuantity ?? template.quantity ?? 1
        const unitPrice = template.selectedUnitPrice ?? template.unit_price ?? 0

        return {
            id: uuidv4(),
            description: template.name,
            part_number: template.part_number || '',
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice,
            supplier: template.supplier || '',
            category: template.category || '',
            warranty_period: template.warranty_period || '',
            notes: template.description || ''
        }
    }

    /**
     * Convert a single template to an expense form item (same structure as part)
     */
    static templateToExpenseItem(template: SelectedTemplate): ExpenseFormItem {
        const quantity = template.selectedQuantity ?? template.quantity ?? 1
        const unitPrice = template.selectedUnitPrice ?? template.unit_price ?? 0

        return {
            id: uuidv4(),
            description: template.name,
            part_number: template.part_number || '',
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice,
            supplier: template.supplier || '',
            category: template.category || '',
            warranty_period: template.warranty_period || '',
            notes: template.description || ''
        }
    }

    /**
     * Convert a single template to a generic form item (service, fee, discount, package)
     */
    static templateToGenericItem(template: SelectedTemplate): GenericFormItem {
        const quantity = template.selectedQuantity ?? template.quantity ?? 1
        const unitPrice = template.selectedUnitPrice ?? template.unit_price ?? 0

        return {
            id: uuidv4(),
            description: template.name,
            quantity,
            unit_price: unitPrice,
            total_price: quantity * unitPrice,
            notes: template.description || ''
        }
    }

    /**
     * Convert a single template to the appropriate form item based on item_type
     * Returns the converted item and the item type
     */
    static convertTemplate(template: SelectedTemplate): {
        item: LaborFormItem | PartFormItem | ExpenseFormItem | GenericFormItem
        itemType: 'labor' | 'part' | 'expense' | 'service' | 'fee' | 'discount' | 'package'
    } {
        const itemType = template.item_type

        switch (itemType) {
            case 'labor':
                return { item: this.templateToLaborItem(template), itemType }
            case 'part':
                return { item: this.templateToPartItem(template), itemType }
            case 'expense':
                return { item: this.templateToExpenseItem(template), itemType }
            case 'service':
            case 'fee':
            case 'discount':
            case 'package':
                return { item: this.templateToGenericItem(template), itemType }
            default:
                throw new Error(`Unknown template item type: ${itemType}`)
        }
    }

    /**
     * Convert multiple templates to form items, grouped by type
     */
    static convertTemplates(templates: SelectedTemplate[]): ConvertedItems {
        const items: ConvertedItems = {
            laborItems: [],
            partsItems: [],
            expenseItems: [],
            serviceItems: [],
            feeItems: [],
            discountItems: [],
            packageItems: []
        }

        templates.forEach(template => {
            const { item, itemType } = this.convertTemplate(template)

            switch (itemType) {
                case 'labor':
                    items.laborItems.push(item as LaborFormItem)
                    break
                case 'part':
                    items.partsItems.push(item as PartFormItem)
                    break
                case 'expense':
                    items.expenseItems.push(item as ExpenseFormItem)
                    break
                case 'service':
                    items.serviceItems.push(item as GenericFormItem)
                    break
                case 'fee':
                    items.feeItems.push(item as GenericFormItem)
                    break
                case 'discount':
                    items.discountItems.push(item as GenericFormItem)
                    break
                case 'package':
                    items.packageItems.push(item as GenericFormItem)
                    break
            }
        })

        return items
    }

    /**
     * Check if a template is already in the items list (by description matching)
     */
    static isTemplateInItems(
        template: WorkOrderItemTemplate,
        items: Array<{ description: string }>
    ): boolean {
        return items.some(item => item.description === template.name)
    }

    /**
     * Remove templates from selected list when their corresponding items are deleted
     */
    static filterSelectedTemplates(
        selectedTemplates: SelectedTemplate[],
        itemsByType: {
            laborItems?: LaborFormItem[]
            partsItems?: PartFormItem[]
            expenseItems?: ExpenseFormItem[]
            serviceItems?: GenericFormItem[]
            feeItems?: GenericFormItem[]
            discountItems?: GenericFormItem[]
            packageItems?: GenericFormItem[]
        }
    ): SelectedTemplate[] {
        return selectedTemplates.filter(template => {
            switch (template.item_type) {
                case 'labor':
                    return itemsByType.laborItems
                        ? this.isTemplateInItems(template, itemsByType.laborItems)
                        : true
                case 'part':
                    return itemsByType.partsItems
                        ? this.isTemplateInItems(template, itemsByType.partsItems)
                        : true
                case 'expense':
                    return itemsByType.expenseItems
                        ? this.isTemplateInItems(template, itemsByType.expenseItems)
                        : true
                case 'service':
                    return itemsByType.serviceItems
                        ? this.isTemplateInItems(template, itemsByType.serviceItems)
                        : true
                case 'fee':
                    return itemsByType.feeItems
                        ? this.isTemplateInItems(template, itemsByType.feeItems)
                        : true
                case 'discount':
                    return itemsByType.discountItems
                        ? this.isTemplateInItems(template, itemsByType.discountItems)
                        : true
                case 'package':
                    return itemsByType.packageItems
                        ? this.isTemplateInItems(template, itemsByType.packageItems)
                        : true
                default:
                    return true
            }
        })
    }
}

