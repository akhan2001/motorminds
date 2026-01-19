/**
 * Shared utilities for invoice calculations in financial reports
 * Uses the new invoices_table structure
 */

export interface InvoiceItem {
    id: string
    item_type: 'labor' | 'part' | 'expense' | 'service' | 'fee' | 'discount' | 'package'
    description: string
    quantity: number
    unit_price: number
    total_price: number
    unit_cost?: number | null
    total_cost?: number | null
    part_number?: string | null
    supplier?: string | null
    category?: string | null
    labor_hours?: number | null
    technician_id?: string | null
}

export interface InvoiceTableRecord {
    id: string
    invoice_number: string
    shop_id: string
    status: string
    total_amount: number
    subtotal: number
    tax_amount: number
    discount_amount: number
    labor_total: number
    parts_total: number
    services_total: number
    fees_total: number
    invoice_items: InvoiceItem[] | null
    paid_date: string | null
    created_at: string
}

export interface RevenueBreakdown {
    totalRevenue: number
    laborRevenue: number
    partsRevenue: number
    servicesRevenue: number
    feesRevenue: number
    subtotal: number
    taxAmount: number
    discountAmount: number
}

export interface COGSBreakdown {
    totalCOGS: number
    details: Array<{
        description: string
        quantity: number
        unitCost: number
        totalCost: number
        partNumber?: string | null
        supplier?: string | null
    }>
}

/**
 * Calculate Cost of Goods Sold (COGS) from invoice items
 * COGS = sum of (unit_cost * quantity) for parts
 */
export function calculateCOGS(invoiceItems: InvoiceItem[] | null): COGSBreakdown {
    if (!invoiceItems || !Array.isArray(invoiceItems)) {
        return { totalCOGS: 0, details: [] }
    }

    const partsWithCost = invoiceItems.filter(item => 
        item.item_type === 'part' && (item.unit_cost || item.total_cost)
    )

    const details = partsWithCost.map(item => {
        const quantity = Number(item.quantity) || 1
        const unitCost = Number(item.unit_cost) || 0
        const totalCost = item.total_cost ? Number(item.total_cost) : (unitCost * quantity)
        
        return {
            description: item.description,
            quantity,
            unitCost,
            totalCost,
            partNumber: item.part_number,
            supplier: item.supplier
        }
    })

    const totalCOGS = details.reduce((acc, item) => acc + item.totalCost, 0)

    return { totalCOGS, details }
}

/**
 * Calculate COGS from multiple invoices
 */
export function calculateTotalCOGS(invoices: InvoiceTableRecord[]): COGSBreakdown {
    const allDetails: COGSBreakdown['details'] = []
    let totalCOGS = 0

    for (const invoice of invoices) {
        const breakdown = calculateCOGS(invoice.invoice_items)
        totalCOGS += breakdown.totalCOGS
        allDetails.push(...breakdown.details)
    }

    return { totalCOGS, details: allDetails }
}

/**
 * Extract revenue breakdown from an invoice using actual granular totals
 */
export function extractRevenueBreakdown(invoice: InvoiceTableRecord): RevenueBreakdown {
    return {
        totalRevenue: Number(invoice.total_amount) || 0,
        laborRevenue: Number(invoice.labor_total) || 0,
        partsRevenue: Number(invoice.parts_total) || 0,
        servicesRevenue: Number(invoice.services_total) || 0,
        feesRevenue: Number(invoice.fees_total) || 0,
        subtotal: Number(invoice.subtotal) || 0,
        taxAmount: Number(invoice.tax_amount) || 0,
        discountAmount: Number(invoice.discount_amount) || 0
    }
}

/**
 * Aggregate revenue breakdown from multiple invoices
 */
export function aggregateRevenueBreakdown(invoices: InvoiceTableRecord[]): RevenueBreakdown {
    return invoices.reduce((acc, invoice) => {
        const breakdown = extractRevenueBreakdown(invoice)
        return {
            totalRevenue: acc.totalRevenue + breakdown.totalRevenue,
            laborRevenue: acc.laborRevenue + breakdown.laborRevenue,
            partsRevenue: acc.partsRevenue + breakdown.partsRevenue,
            servicesRevenue: acc.servicesRevenue + breakdown.servicesRevenue,
            feesRevenue: acc.feesRevenue + breakdown.feesRevenue,
            subtotal: acc.subtotal + breakdown.subtotal,
            taxAmount: acc.taxAmount + breakdown.taxAmount,
            discountAmount: acc.discountAmount + breakdown.discountAmount
        }
    }, {
        totalRevenue: 0,
        laborRevenue: 0,
        partsRevenue: 0,
        servicesRevenue: 0,
        feesRevenue: 0,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0
    })
}

/**
 * Filter invoices by paid status and date range
 * Uses paid_date field from invoices_table
 */
export function filterPaidInvoices(
    invoices: InvoiceTableRecord[],
    startDate: string,
    endDate: string
): InvoiceTableRecord[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return invoices.filter(invoice => {
        // Must be paid status
        if (invoice.status !== 'paid') return false
        
        // Must have paid_date within range
        if (!invoice.paid_date) return false
        
        const paidDate = new Date(invoice.paid_date)
        return paidDate >= start && paidDate <= end
    })
}

/**
 * Generate revenue details for reports
 */
export function generateRevenueDetails(invoices: InvoiceTableRecord[]): Array<{
    invoice_number: string
    description: string
    total_amount: number
    labor_total: number
    parts_total: number
    services_total: number
    fees_total: number
    paid_date: string | null
}> {
    return invoices.map(invoice => ({
        invoice_number: invoice.invoice_number,
        description: `Invoice #${invoice.invoice_number}`,
        total_amount: Number(invoice.total_amount) || 0,
        labor_total: Number(invoice.labor_total) || 0,
        parts_total: Number(invoice.parts_total) || 0,
        services_total: Number(invoice.services_total) || 0,
        fees_total: Number(invoice.fees_total) || 0,
        paid_date: invoice.paid_date
    }))
}
