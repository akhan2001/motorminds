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