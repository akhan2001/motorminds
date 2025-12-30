import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { WorkOrderItemTemplate } from '../../../../types/work-order-item-templates'
import type {
    SelectedTemplate,
    LaborFormItem,
    PartFormItem,
    ExpenseFormItem,
    GenericFormItem
} from '../../../../types/work-order-item-forms'
import { TemplateToItemConverter } from '../../../../lib/template-to-item-converter'

/**
 * Custom hook for managing template selection and conversion in work order creation
 */
export function useCreateTemplateManagement(
    onLaborItemsChange: (items: LaborFormItem[]) => void,
    onPartsItemsChange: (items: PartFormItem[]) => void,
    onExpenseItemsChange: (items: ExpenseFormItem[]) => void,
    onServiceItemsChange: (items: GenericFormItem[]) => void,
    onFeeItemsChange: (items: GenericFormItem[]) => void,
    onDiscountItemsChange: (items: GenericFormItem[]) => void,
    onPackageItemsChange: (items: GenericFormItem[]) => void,
    currentItems: {
        laborItems: LaborFormItem[]
        partsItems: PartFormItem[]
        expenseItems: ExpenseFormItem[]
        serviceItems: GenericFormItem[]
        feeItems: GenericFormItem[]
        discountItems: GenericFormItem[]
        packageItems: GenericFormItem[]
    }
) {
    const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([])

    /**
     * Handle template selection and conversion
     */
    const handleTemplateSelect = useCallback((template: WorkOrderItemTemplate) => {
        // Check if template is already selected
        const isAlreadySelected = selectedTemplates.some(selected => selected.id === template.id)

        if (isAlreadySelected) {
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

        // Convert template to item based on type
        const { item, itemType } = TemplateToItemConverter.convertTemplate(selectedTemplate)

        // Add to appropriate items list
        switch (itemType) {
            case 'labor':
                onLaborItemsChange([...currentItems.laborItems, item as LaborFormItem])
                toast.success(`Labor template "${template.name}" added to items`)
                break
            case 'part':
                onPartsItemsChange([...currentItems.partsItems, item as PartFormItem])
                toast.success(`Part template "${template.name}" added to items`)
                break
            case 'expense':
                onExpenseItemsChange([...currentItems.expenseItems, item as ExpenseFormItem])
                toast.success(`Expense template "${template.name}" added to items`)
                break
            case 'service':
                onServiceItemsChange([...currentItems.serviceItems, item as GenericFormItem])
                toast.success(`Service template "${template.name}" added to items`)
                break
            case 'fee':
                onFeeItemsChange([...currentItems.feeItems, item as GenericFormItem])
                toast.success(`Fee template "${template.name}" added to items`)
                break
            case 'discount':
                onDiscountItemsChange([...currentItems.discountItems, item as GenericFormItem])
                toast.success(`Discount template "${template.name}" added to items`)
                break
            case 'package':
                onPackageItemsChange([...currentItems.packageItems, item as GenericFormItem])
                toast.success(`Package template "${template.name}" added to items`)
                break
        }
    }, [
        selectedTemplates,
        currentItems,
        onLaborItemsChange,
        onPartsItemsChange,
        onExpenseItemsChange,
        onServiceItemsChange,
        onFeeItemsChange,
        onDiscountItemsChange,
        onPackageItemsChange
    ])

    /**
     * Sync selected templates when items are removed
     */
    const syncSelectedTemplates = useCallback(() => {
        setSelectedTemplates(prev =>
            TemplateToItemConverter.filterSelectedTemplates(prev, currentItems)
        )
    }, [currentItems])

    return {
        selectedTemplates,
        handleTemplateSelect,
        syncSelectedTemplates
    }
}
