import { supabase } from "@/lib/supabase";
import { 
    StatementInvoice, 
    StatementDateRange, 
    StatementTotals, 
    StatementTransaction 
} from "../types/statement";

/**
 * Fetch all invoices for a specific customer within a date range
 */
export async function fetchCustomerInvoices(
    customerId: string, 
    shopId: string, 
    dateRange?: StatementDateRange
): Promise<StatementInvoice[]> {
    try {
        let query = supabase
            .from('invoices')
            .select('*')
            .eq('customer_id', customerId)
            .eq('shop_id', shopId)
            .order('issue_date', { ascending: true });

        // Apply date range filter if provided
        if (dateRange) {
            query = query
                .gte('issue_date', dateRange.start.toISOString())
                .lte('issue_date', dateRange.end.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching customer invoices:', error);
            console.error('Error details:', JSON.stringify(error));
            throw error;
        }

        console.log('Fetched invoices:', data?.length || 0);

        // Map database results to StatementInvoice format
        return (data || []).map(invoice => ({
            invoice_number: invoice.invoice_number,
            display_id: invoice.display_id,
            issue_date: invoice.issue_date,
            amount: invoice.amount,
            status: invoice.status,
            description: invoice.description,
            client_name: invoice.client_name,
            labour_total_price: invoice.labour_total_price,
            parts_total_price: invoice.parts_total_price,
            notes: invoice.notes,
            vehicle_info: invoice.vehicle_information
        }));
    } catch (error) {
        console.error('Error in fetchCustomerInvoices:', error);
        throw error;
    }
}

/**
 * Fetch invoices before the date range to calculate previous balance
 */
export async function fetchPreviousInvoices(
    customerId: string,
    shopId: string,
    beforeDate: Date
): Promise<StatementInvoice[]> {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('customer_id', customerId)
            .eq('shop_id', shopId)
            .lt('issue_date', beforeDate.toISOString())
            .order('issue_date', { ascending: true });

        if (error) {
            console.error('Error fetching previous invoices:', error);
            throw error;
        }

        console.log('Fetched previous invoices:', data?.length || 0);

        // Map database results to StatementInvoice format
        return (data || []).map(invoice => ({
            invoice_number: invoice.invoice_number,
            display_id: invoice.display_id,
            issue_date: invoice.issue_date,
            amount: invoice.amount,
            status: invoice.status,
            description: invoice.description,
            client_name: invoice.client_name,
            labour_total_price: invoice.labour_total_price,
            parts_total_price: invoice.parts_total_price,
            notes: invoice.notes,
            vehicle_info: invoice.vehicle_information
        }));
    } catch (error) {
        console.error('Error in fetchPreviousInvoices:', error);
        throw error;
    }
}

/**
 * Calculate statement totals
 */
export function calculateStatementTotals(
    currentInvoices: StatementInvoice[],
    previousInvoices: StatementInvoice[]
): StatementTotals {
    // Calculate previous balance (unpaid invoices before date range)
    const previousBalance = previousInvoices
        .filter(inv => inv.status === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Calculate new charges (unpaid invoices in current period)
    const newCharges = currentInvoices
        .filter(inv => inv.status === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Calculate payments/credits (paid invoices in current period)
    const paymentsCredits = currentInvoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Current balance = previous balance + new charges - payments
    const currentBalance = previousBalance + newCharges;

    return {
        previousBalance,
        newCharges,
        paymentsCredits,
        currentBalance
    };
}

/**
 * Calculate running balance for transactions
 */
export function calculateRunningBalance(
    invoices: StatementInvoice[],
    startingBalance: number
): StatementTransaction[] {
    let runningBalance = startingBalance;
    const transactions: StatementTransaction[] = [];

    // Sort invoices by date
    const sortedInvoices = [...invoices].sort((a, b) => 
        new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
    );

    for (const invoice of sortedInvoices) {
        const amount = invoice.amount || 0;
        const isPaid = invoice.status === 'PAID';

        // For unpaid invoices, add to charges (increases balance)
        // For paid invoices, add to payments (decreases balance)
        if (!isPaid) {
            runningBalance += amount;
        }

        // Format vehicle information
        let vehicleInfo = '';
        if (invoice.vehicle_info) {
            const { year, make, model, license_plate } = invoice.vehicle_info;
            const parts = [year, make, model].filter(Boolean);
            vehicleInfo = parts.join(' ');
            if (license_plate && license_plate !== 'NULL') {
                vehicleInfo += ` (${license_plate})`;
            }
        }

        transactions.push({
            date: invoice.issue_date,
            reference: invoice.display_id || invoice.invoice_number.substring(0, 8),
            invoiceId: invoice.invoice_number,
            description: invoice.description || 'Service Invoice',
            charges: amount,
            payments: isPaid ? amount : 0,
            balance: runningBalance,
            status: invoice.status,
            vehicle: vehicleInfo || undefined,
            notes: invoice.notes || undefined
        });

        // If paid, subtract from running balance
        if (isPaid) {
            runningBalance -= amount;
        }
    }

    return transactions;
}

/**
 * Generate unique statement number
 */
export function generateStatementNumber(
    shopId: string,
    customerId: string,
    date: Date = new Date()
): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const customerShort = customerId.substring(0, 8);
    
    return `ST-${year}${month}-${customerShort}`;
}

/**
 * Format date for display
 */
export function formatStatementDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Format currency for display
 */
export function formatStatementCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Get date range presets
 */
export function getDateRangePresets(): { label: string, getValue: () => StatementDateRange }[] {
    const today = new Date();
    
    return [
        {
            label: 'Last 30 Days',
            getValue: () => ({
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
                end: today
            })
        },
        {
            label: 'Last 90 Days',
            getValue: () => ({
                start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90),
                end: today
            })
        },
        {
            label: 'Last 6 Months',
            getValue: () => ({
                start: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()),
                end: today
            })
        },
        {
            label: 'Last 12 Months',
            getValue: () => ({
                start: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
                end: today
            })
        },
        {
            label: 'Year to Date',
            getValue: () => ({
                start: new Date(today.getFullYear(), 0, 1),
                end: today
            })
        },
        {
            label: 'All Time',
            getValue: () => ({
                start: new Date(2020, 0, 1), // Arbitrary old date
                end: today
            })
        }
    ];
}
