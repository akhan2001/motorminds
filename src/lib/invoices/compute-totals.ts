import type { InvoiceLineItem } from '@/app/api/mia/invoices/schemas'

export interface InvoiceTotals {
    subtotal: number
    discount_amount: number
    tax_amount: number
    total: number
    line_items_total: number
}

export interface ComputeTotalsOptions {
    line_items: InvoiceLineItem[]
    discount_amount?: number
    tax_rate?: number
}

/**
 * Computes all totals for an invoice
 * @param options - Line items, discount, and tax rate
 * @returns Computed totals with proper rounding
 */
export function computeInvoiceTotals({
    line_items,
    discount_amount = 0,
    tax_rate = 0.13 // Default HST rate
}: ComputeTotalsOptions): InvoiceTotals {
    // Calculate line items total (sum of all line_total values)
    const line_items_total = line_items.reduce((sum, item) => {
        return sum + (item.line_total || (item.quantity * item.unit_price))
    }, 0)

    // Subtotal is the line items total
    const subtotal = line_items_total

    // Apply discount
    const discount_amount_final = Math.min(discount_amount, subtotal) // Discount cannot exceed subtotal

    // Calculate taxable amount (subtotal minus discount)
    const taxable_amount = subtotal - discount_amount_final

    // Calculate tax
    const tax_amount = taxable_amount * tax_rate

    // Calculate final total
    const total = taxable_amount + tax_amount

    // Round all amounts to 2 decimal places
    return {
        line_items_total: Math.round(line_items_total * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        discount_amount: Math.round(discount_amount_final * 100) / 100,
        tax_amount: Math.round(tax_amount * 100) / 100,
        total: Math.round(total * 100) / 100
    }
}

/**
 * Computes line total for a single line item
 * @param quantity - Quantity of the item
 * @param unit_price - Price per unit
 * @returns Rounded line total
 */
export function computeLineTotal(quantity: number, unit_price: number): number {
    return Math.round(quantity * unit_price * 100) / 100
}

/**
 * Validates that computed totals match stored totals (for data integrity checks)
 * @param stored_totals - Totals stored in database
 * @param computed_totals - Freshly computed totals
 * @param tolerance - Allowed difference due to rounding (default: $0.01)
 * @returns True if totals match within tolerance
 */
export function validateTotalsMatch(
    stored_totals: Partial<InvoiceTotals>,
    computed_totals: InvoiceTotals,
    tolerance: number = 0.01
): boolean {
    const fields: (keyof InvoiceTotals)[] = ['subtotal', 'discount_amount', 'tax_amount', 'total', 'line_items_total']
    
    return fields.every(field => {
        if (stored_totals[field] === undefined) return true
        const diff = Math.abs(stored_totals[field]! - computed_totals[field])
        return diff <= tolerance
    })
}

/**
 * Formats a number as currency string (CAD)
 * @param amount - Numeric amount
 * @param currency_code - Currency code (default: CAD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency_code: string = 'CAD'): string {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: currency_code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

/**
 * Calculates suggested pricing based on common automotive service rates
 */
export const servicePricingGuide = {
    labor: {
        basic_service: 120.0,      // Basic service/maintenance per hour
        diagnostic: 150.0,         // Diagnostic work per hour  
        repair: 140.0,            // General repair work per hour
        specialty: 175.0          // Specialty work per hour
    },
    parts: {
        markup_percentage: 0.30   // 30% markup on parts cost
    }
}

/**
 * Suggests line item pricing based on category and description
 * @param category - Category of the line item
 * @param description - Description to analyze
 * @param quantity - Quantity (default: 1)
 * @returns Suggested unit price
 */
export function suggestLineItemPrice(
    category: 'parts' | 'labor' | 'service' | 'other',
    description: string,
    quantity: number = 1
): number {
    const desc = description.toLowerCase()
    
    switch (category) {
        case 'labor':
        case 'service':
            // Analyze description for complexity
            if (desc.includes('diagnostic') || desc.includes('diagnosis')) {
                return servicePricingGuide.labor.diagnostic
            }
            if (desc.includes('oil change') || desc.includes('basic')) {
                return servicePricingGuide.labor.basic_service
            }
            if (desc.includes('transmission') || desc.includes('engine rebuild') || desc.includes('specialty')) {
                return servicePricingGuide.labor.specialty
            }
            return servicePricingGuide.labor.repair
            
        case 'parts':
            // For parts, we'd need a parts database lookup
            // For now, return a placeholder that suggests manual entry
            return 0.0
            
        case 'other':
            return 0.0
            
        default:
            return 0.0
    }
}
