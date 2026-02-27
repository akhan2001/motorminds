import { v4 as uuidv4 } from 'uuid'
import type { PartFormItem } from '../types/work-order-item-forms'
import type { ExpenseListItemFormData } from '@/app/(features)/expenses/lib/validations/expense-schema'
import { calculateSubtotalFromTotal } from '@/app/(features)/expenses/lib/validations/expense-schema'
import { getTorontoDateString } from '@/lib/utils/date'

const TEMP_ID_PREFIX = 'temp-'

/** Convert a part item to an expense list item (for "Create Expense" from part). */
export function partToExpenseItem(part: PartFormItem, partIndex: number): ExpenseListItemFormData {
    const total = part.total_price
    const { subtotal, taxAmount } = calculateSubtotalFromTotal(total, true)
    const createdFromNote = `Created from Part Item #${partIndex + 1}`
    const notes = part.notes?.trim()
        ? `${createdFromNote}\n${part.notes}`
        : createdFromNote
    return {
        id: `${TEMP_ID_PREFIX}${uuidv4()}`,
        description: part.description.trim(),
        category: 'Parts & Supplies',
        subtotal,
        tax_amount: taxAmount,
        tax_rate: 0.13,
        tax_included: true,
        total,
        vendor: part.supplier?.trim() || null,
        invoice_number: part.part_number?.trim() || null,
        payment_method: 'credit_card',
        parts_description: part.notes?.trim() || null,
        expense_date: getTorontoDateString(),
        warranty_period: part.warranty_period?.trim() || null,
        notes,
        sourcePartId: part.id,
    }
}
