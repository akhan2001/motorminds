/**
 * Resolution types for expenses when work orders are declined
 * These track what happened to the cost after customer declined
 */
export type ExpenseResolutionType =
    | 'returned'        // Full return to supplier
    | 'credited'        // Supplier credit received
    | 'restocking_fee'  // Partial return (restocking deduction)
    | 'written_off'     // Complete loss
    | 'reassigned'      // Moved to another work order
    | 'inventory';      // Added to shop inventory

export interface ExpenseItem {
    id: string;
    shop_id: string;
    work_order_id: string | null;
    invoice_id: string | null;
    source_type: 'work_order' | 'invoice' | 'general';
    description: string;
    category: string;
    subtotal: number;
    tax_amount: number | null;
    tax_rate: number | null;
    tax_included: boolean | null;
    total: number;
    vendor: string | null;
    invoice_number: string | null;
    payment_method: string | null;
    parts_description: string | null;
    expense_date: string;
    warranty_period: string | null;
    notes: string | null;
    receipt_url: string | null;
    is_billable: boolean | null;
    created_at: string;
    updated_at: string;
    archived: boolean | null;
    archived_at: string | null;
    // Resolution fields for declined work orders
    resolution_type: ExpenseResolutionType | null;
    resolution_note: string | null;
    resolved_at: string | null;
    original_work_order_id: string | null;  // Immutable - tracks history
    refund_amount: number | null;           // For partial refunds
}

export interface CreateExpenseRequest {
    shop_id: string;
    work_order_id?: string | null;
    invoice_id?: string | null;
    source_type: 'work_order' | 'invoice' | 'general';
    description: string;
    category: string;
    subtotal: number;
    tax_amount?: number | null;
    tax_rate?: number | null;
    tax_included?: boolean | null;
    total: number;
    vendor?: string | null;
    invoice_number?: string | null;
    payment_method?: string | null;
    parts_description?: string | null;
    expense_date: string;
    warranty_period?: string | null;
    notes?: string | null;
    receipt_url?: string | null;
    is_billable?: boolean | null;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
    archived?: boolean | null;
    archived_at?: string | null;
    // Resolution fields
    resolution_type?: ExpenseResolutionType | null;
    resolution_note?: string | null;
    resolved_at?: string | null;
    original_work_order_id?: string | null;
    refund_amount?: number | null;
}

/**
 * Request to resolve an expense (when work order is declined)
 */
export interface ResolveExpenseRequest {
    resolution_type: ExpenseResolutionType;
    resolution_note?: string | null;
    refund_amount?: number | null;
    // For reassignment
    new_work_order_id?: string | null;
}

export interface ExpenseFilters {
    work_order_id?: string;
    invoice_id?: string;
    source_type?: ExpenseItem['source_type'];
    category?: string;
    vendor?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    archived?: boolean;
    // Resolution filters
    resolution_type?: ExpenseResolutionType;
    needs_resolution?: boolean;  // Expenses with null work_order_id but linked originally
}

export interface ExpensesResponse {
    expenses: ExpenseItem[];
    total: number;
    page: number;
    limit: number;
}

export interface ExpensesStatsCardsProps {
    isLoading: boolean
    stats?: {
        totalExpenses: number
        workOrderExpenses: number
        invoiceExpenses: number
        generalExpenses: number
    }
    totalCount?: number
    currentPageCount?: number
}