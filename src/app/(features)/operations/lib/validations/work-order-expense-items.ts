import { z } from 'zod'

/**
 * Payment method enum for expense items
 */
export const EXPENSE_PAYMENT_METHODS = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
] as const

/**
 * Expense categories matching AddExpenseModal
 */
export const EXPENSE_CATEGORIES = [
    'Parts/Inventory',
    'Tools/Equipment',
    'Repairs/Maintenance',
    'Training/Certification',
    'Marketing/Advertising',
    'Legal/Consulting',
    'Office Supplies',
    'Utilities',
    'Rent/Lease',
    'Insurance',
    'Other',
] as const

/**
 * HST tax rate
 */
export const HST_RATE = 0.13

/**
 * Single expense item schema for form validation
 * 
 * Required fields (marked with * in UI):
 * - description (Expense Name)
 * - total_price (Total) - must be > 0 for a valid expense
 * - category
 * - expense_cost_date (Date)
 */
export const WorkOrderExpenseItemSchema = z.object({
    id: z.string(),
    description: z.string().trim().min(1, 'Expense name is required').max(500, 'Description must be 500 characters or less'),
    
    // Legacy fields (for backward compatibility)
    part_number: z.string().max(100).optional().nullable(),
    supplier: z.string().max(200).optional().nullable(),
    
    // Core fields - total_price is required and must be positive
    quantity: z.number().positive('Quantity must be greater than 0').default(1),
    unit_price: z.number().nonnegative('Unit price cannot be negative').default(0),
    total_price: z.number().positive('Total amount is required and must be greater than 0'),
    unit_cost: z.number().nonnegative('Unit cost cannot be negative').optional().nullable(),
    total_cost: z.number().nonnegative().optional().nullable(),
    
    // Metadata - category is required
    category: z.string().min(1, 'Category is required').max(100),
    warranty_period: z.string().max(50).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    is_billable: z.literal(false).default(false), // Always false for expenses
    
    // Expense-specific fields (mirror one_time_costs)
    expense_subtotal: z.number().nonnegative('Subtotal cannot be negative').optional().nullable(),
    expense_tax_amount: z.number().nonnegative('Tax amount cannot be negative').optional().nullable(),
    expense_tax_included: z.boolean().default(true),
    expense_payment_method: z.enum(['credit_card', 'debit_card', 'cash', 'check', 'bank_transfer', 'other']).optional().nullable(),
    expense_vendor: z.string().max(200).optional().nullable(),
    expense_invoice_number: z.string().max(100).optional().nullable(),
    expense_parts_description: z.string().max(1000).optional().nullable(),
    expense_cost_date: z.string().min(1, 'Date is required'),
})

/**
 * Form schema for the expense items array
 */
export const WorkOrderExpenseItemsFormSchema = z.object({
    items: z.array(WorkOrderExpenseItemSchema).max(20, 'Maximum 20 expense items allowed'),
})

/**
 * Type for a single expense item form data
 */
export type WorkOrderExpenseItemFormData = z.infer<typeof WorkOrderExpenseItemSchema>

/**
 * Type for the expense items form
 */
export type WorkOrderExpenseItemsFormData = z.infer<typeof WorkOrderExpenseItemsFormSchema>

/**
 * Create default expense item with proper defaults
 */
export function createDefaultExpenseItem(id: string): WorkOrderExpenseItemFormData {
    const today = new Date().toISOString().split('T')[0]
    return {
        id,
        description: '',
        part_number: null,
        supplier: null,
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        unit_cost: null,
        total_cost: null,
        category: 'Parts/Inventory',
        warranty_period: null,
        notes: null,
        is_billable: false,
        expense_subtotal: null,
        expense_tax_amount: null,
        expense_tax_included: true,
        expense_payment_method: 'credit_card',
        expense_vendor: null,
        expense_invoice_number: null,
        expense_parts_description: null,
        expense_cost_date: today,
    }
}

/**
 * Calculate tax and total from subtotal
 */
export function calculateTaxFromSubtotal(
    subtotal: number, 
    includeTax: boolean
): { taxAmount: number; total: number } {
    if (includeTax && subtotal > 0) {
        const taxAmount = subtotal * HST_RATE
        return { taxAmount, total: subtotal + taxAmount }
    }
    return { taxAmount: 0, total: subtotal }
}

/**
 * Calculate subtotal and tax from total (reverse calculation)
 */
export function calculateSubtotalFromTotal(
    total: number, 
    includeTax: boolean
): { subtotal: number; taxAmount: number } {
    if (includeTax && total > 0) {
        const subtotal = total / (1 + HST_RATE)
        const taxAmount = subtotal * HST_RATE
        return { subtotal, taxAmount }
    }
    return { subtotal: total, taxAmount: 0 }
}
