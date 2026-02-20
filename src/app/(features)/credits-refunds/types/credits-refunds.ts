/**
 * Credits & Refunds types
 * Mirrors expense structure - represents money flowing back into the business
 */

export type CreditRefundStatus = 'pending' | 'processed' | 'reconciled'

export interface RelatedExpenseInfo {
    id: string
    description: string
    vendor: string | null
    total: number
    expense_date: string
    work_order_id: string | null
}

export interface CreditRefundItem {
    id: string
    shop_id: string
    amount: number
    supplier: string | null
    supplier_id: string | null
    reason: string
    related_expense_id: string | null
    related_expense?: RelatedExpenseInfo | null
    /** Part number - for standalone credits (not expense-linked) */
    part_number?: string | null
    /** Description - for standalone credits (not expense-linked) */
    description?: string | null
    /** Parts description - for standalone credits (not expense-linked) */
    parts_description?: string | null
    /** Invoice number - for standalone credits (not expense-linked) */
    invoice_number?: string | null
    status: CreditRefundStatus
    refund_date: string
    notes: string | null
    created_at: string
    updated_at: string
    archived: boolean | null
    archived_at: string | null
}

export interface CreateCreditRefundRequest {
    shop_id: string
    amount: number
    supplier?: string | null
    supplier_id?: string | null
    reason: string
    related_expense_id?: string | null
    /** Part number - required for standalone credits (when no related_expense_id) */
    part_number?: string | null
    /** Description - required for standalone credits (when no related_expense_id) */
    description?: string | null
    /** Parts description - optional for standalone credits */
    parts_description?: string | null
    /** Invoice number - optional for standalone credits */
    invoice_number?: string | null
    status?: CreditRefundStatus
    refund_date: string
    notes?: string | null
}

export interface UpdateCreditRefundRequest {
    amount?: number
    supplier?: string | null
    supplier_id?: string | null
    reason?: string
    related_expense_id?: string | null
    part_number?: string | null
    description?: string | null
    parts_description?: string | null
    invoice_number?: string | null
    status?: CreditRefundStatus
    refund_date?: string
    notes?: string | null
    archived?: boolean | null
    archived_at?: string | null
}

export interface CreditRefundFilters {
    date_from?: string
    date_to?: string
    supplier?: string
    status?: CreditRefundStatus
    amount_min?: number
    amount_max?: number
    search?: string
    archived?: boolean
}

export interface CreditsRefundsResponse {
    creditsRefunds: CreditRefundItem[]
    total: number
    page: number
    limit: number
}

export interface CreditRefundHistoryEntry {
    id: string
    credits_refund_id: string
    action: string
    changed_by: string | null
    changed_at: string
    old_values: Record<string, unknown> | null
    new_values: Record<string, unknown> | null
}
