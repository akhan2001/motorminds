import { z } from 'zod'

/**
 * Payment method enum for expenses
 */
export const EXPENSE_PAYMENT_METHODS = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
] as const

export type ExpensePaymentMethod = typeof EXPENSE_PAYMENT_METHODS[number]['value']

/**
 * Expense categories
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

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

/**
 * HST tax rate
 */
export const HST_RATE = 0.13

/**
 * Expense source types
 */
export const EXPENSE_SOURCE_TYPES = ['work_order', 'invoice', 'general'] as const
export type ExpenseSourceType = typeof EXPENSE_SOURCE_TYPES[number]

/**
 * Schema for creating an expense
 */
export const CreateExpenseSchema = z.object({
    shop_id: z.string().uuid('Shop ID must be a valid UUID'),
    work_order_id: z.string().uuid().nullable().optional(),
    invoice_id: z.string().uuid().nullable().optional(),
    source_type: z.enum(['work_order', 'invoice', 'general']).default('work_order'),
    description: z.string().trim().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
    category: z.string().min(1, 'Category is required').max(100),
    subtotal: z.number().nonnegative('Subtotal cannot be negative'),
    tax_amount: z.number().nonnegative('Tax amount cannot be negative').nullable().optional(),
    tax_rate: z.number().min(0).max(1).default(0.13),
    tax_included: z.boolean().default(true),
    total: z.number().positive('Total must be greater than 0'),
    vendor: z.string().max(200).nullable().optional(),
    invoice_number: z.string().max(100).nullable().optional(),
    payment_method: z.enum(['credit_card', 'debit_card', 'cash', 'check', 'bank_transfer', 'other']).nullable().optional(),
    parts_description: z.string().max(1000).nullable().optional(),
    expense_date: z.string().min(1, 'Expense date is required'),
    warranty_period: z.string().max(50).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
    receipt_url: z.string().url('Receipt URL must be a valid URL').max(500).nullable().optional(),
    is_billable: z.boolean().default(false),
})

/** Form schema: receipt_url can be empty string; we coerce to null when submitting */
export const ExpenseFormSchema = CreateExpenseSchema.extend({
    receipt_url: z.string().max(500).nullable().optional(),
})

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>

/**
 * Single expense item for list form (array element) - matches ExpenseItem fields used in cards
 */
export const ExpenseListItemSchema = z.object({
    id: z.string(),
    description: z.string().trim().min(1, 'Description is required').max(500).default(''),
    category: z.string().min(1, 'Category is required').max(100).default('Parts/Inventory'),
    subtotal: z.number().nonnegative().default(0),
    tax_amount: z.number().nonnegative().nullable().optional(),
    tax_rate: z.number().min(0).max(1).default(0.13),
    tax_included: z.boolean().default(true),
    total: z.number().nonnegative().default(0),
    vendor: z.string().max(200).nullable().optional(),
    invoice_number: z.string().max(100).nullable().optional(),
    payment_method: z.enum(['credit_card', 'debit_card', 'cash', 'check', 'bank_transfer', 'other']).nullable().optional(),
    parts_description: z.string().max(1000).nullable().optional(),
    expense_date: z.string().min(1, 'Date is required'),
    warranty_period: z.string().max(50).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
})

export const ExpenseListFormSchema = z.object({
    items: z.array(ExpenseListItemSchema).max(20, 'Maximum 20 expense items allowed'),
})

export type ExpenseListItemFormData = z.infer<typeof ExpenseListItemSchema>
export type ExpenseListFormData = z.infer<typeof ExpenseListFormSchema>

const today = () => new Date().toISOString().split('T')[0]

export function createDefaultExpenseListItem(id: string): ExpenseListItemFormData {
    return {
        id,
        description: '',
        category: 'Parts/Inventory',
        subtotal: 0,
        tax_amount: null,
        tax_rate: 0.13,
        tax_included: true,
        total: 0,
        vendor: null,
        invoice_number: null,
        payment_method: 'credit_card',
        parts_description: null,
        expense_date: today(),
        warranty_period: null,
        notes: null,
    }
}

/**
 * Schema for updating an expense
 */
export const UpdateExpenseSchema = CreateExpenseSchema.partial().extend({
    archived: z.boolean().nullable().optional(),
    archived_at: z.string().nullable().optional(),
})

/**
 * Type inference from schemas
 */
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>

/**
 * Calculate tax and total from subtotal
 */
export function calculateTaxFromSubtotal(
    subtotal: number,
    includeTax: boolean,
    taxRate: number = HST_RATE
): { taxAmount: number; total: number } {
    if (includeTax && subtotal > 0) {
        const taxAmount = subtotal * taxRate
        return { taxAmount, total: subtotal + taxAmount }
    }
    return { taxAmount: 0, total: subtotal }
}

/**
 * Calculate subtotal and tax from total (reverse calculation)
 */
export function calculateSubtotalFromTotal(
    total: number,
    includeTax: boolean,
    taxRate: number = HST_RATE
): { subtotal: number; taxAmount: number } {
    if (includeTax && total > 0) {
        const subtotal = total / (1 + taxRate)
        const taxAmount = subtotal * taxRate
        return { subtotal, taxAmount }
    }
    return { subtotal: total, taxAmount: 0 }
}
