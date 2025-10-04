export interface StatementInvoice {
    invoice_number: string;
    display_id?: string;
    issue_date: string;
    amount: number;
    status: 'PAID' | 'UNPAID';
    description?: string;
    client_name?: string;
    labour_total_price?: number;
    parts_total_price?: number;
    notes?: string;
    vehicle_info?: {
        year?: string;
        make?: string;
        model?: string;
        license_plate?: string;
    };
}

export interface StatementCustomer {
    id: string;
    customer_name: string;
    customer_address?: string;
    customer_phone?: string;
    customer_email?: string;
}

export interface StatementShopInfo {
    shop_name: string;
    shop_address?: string;
    shop_phone?: string;
    shop_email?: string;
    hst_number?: string;
    business_number?: string;
    shop_tagline?: string;
    shop_logo?: string;
}

export interface StatementDateRange {
    start: Date;
    end: Date;
}

export interface StatementTotals {
    previousBalance: number;
    newCharges: number;
    paymentsCredits: number;
    currentBalance: number;
}

export interface StatementTransaction {
    date: string;
    reference: string;
    invoiceId?: string;
    description: string;
    charges: number;
    payments: number;
    balance: number;
    status: string;
    vehicle?: string;
    notes?: string;
}

export interface StatementData {
    statementNumber: string;
    generatedDate: string;
    dateRange: StatementDateRange;
    customer: StatementCustomer;
    shop: StatementShopInfo;
    totals: StatementTotals;
    transactions: StatementTransaction[];
    pageCount?: number;
}

