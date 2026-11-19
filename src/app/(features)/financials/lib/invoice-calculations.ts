import { WorkOrderItem } from '../../operations/types/work-order-items'
import type { InvoiceItem } from '../types/invoice'

export interface InvoiceCalculations {
	subtotal: number
	labourTotal: number
	partsTotal: number
	expensesTotal: number
	servicesTotal: number
	feesTotal: number
	discountsTotal: number
	packagesTotal: number
	approvedItems: WorkOrderItem[]
	rejectedItems: WorkOrderItem[]
	labourItems: WorkOrderItem[]
	partsItems: WorkOrderItem[]
	expensesItems: WorkOrderItem[]
	servicesItems: WorkOrderItem[]
	feesItems: WorkOrderItem[]
	discountsItems: WorkOrderItem[]
	packagesItems: WorkOrderItem[]
}

type LineTotalInput = {
	item_type: string
	quantity?: number | null
	unit_price?: number | null
	labor_hours?: number | null
	total_price?: number | null
}

/**
 * Canonical (gross) line amount for one item. This is the single source of truth
 * for a line's value — always derived from quantity/hours × unit price, never from
 * the stored `total_price` (which can be stale, or net of an inline line discount
 * that is ALSO saved as its own discount row, double-counting the discount).
 *
 * - labor: labor_hours × unit_price
 * - everything else: quantity × |unit_price| (discounts are positive amounts)
 * Falls back to |total_price| only for legacy rows with no unit price at all.
 */
export function getLineTotal(item: LineTotalInput): number {
	const isDiscount = item.item_type === 'discount'
	const rawPrice = Number(item.unit_price) || 0
	const unitPrice = isDiscount ? Math.abs(rawPrice) : rawPrice
	const multiplier = item.item_type === 'labor'
		? Number(item.labor_hours) || 0
		: Number(item.quantity) || 0
	if (unitPrice === 0 && item.total_price) {
		const stored = Number(item.total_price) || 0
		return isDiscount ? Math.abs(stored) : stored
	}
	return multiplier * unitPrice
}

/**
 * Return invoice items with total_price recomputed via getLineTotal, so every
 * display (view, PDF templates, previews, editor) agrees with the stored invoice
 * total and the work order. Expenses (tracking only) are left untouched.
 */
export function normalizeInvoiceItems<T extends LineTotalInput>(items: T[] | null | undefined): T[] {
	if (!Array.isArray(items)) return []
	return items.map(item =>
		item.item_type === 'expense' ? item : { ...item, total_price: getLineTotal(item) }
	)
}

/**
 * Subtotal / tax / total for a list of invoice items, using the same rules as the
 * stored invoice totals: declined items and expenses (tracking only) are excluded,
 * discounts are subtracted.
 */
export function computeInvoiceSummary(
	items: Array<LineTotalInput & { active?: boolean | null }>,
	taxRate: number,
	invoiceDiscount = 0
): { subtotal: number; tax: number; total: number } {
	const subtotal = (items || [])
		.filter((item: any) => item.active !== false && item.item_type !== 'expense')
		.reduce((sum, item) => {
			const amount = getLineTotal(item)
			return item.item_type === 'discount' ? sum - amount : sum + amount
		}, 0)
	const tax = subtotal * (Number(taxRate) || 0)
	return { subtotal, tax, total: subtotal + tax - (Number(invoiceDiscount) || 0) }
}

/**
 * Calculate invoice totals from work order items, excluding rejected items
 */
export function calculateInvoiceTotals(workOrderItems: WorkOrderItem[]): InvoiceCalculations {
	// Separate approved and rejected items
	const approvedItems = workOrderItems.filter(item => item.active !== false)
	const rejectedItems = workOrderItems.filter(item => item.active === false)
	
	// Separate approved items by type
	const labourItems = approvedItems.filter(item => item.item_type === 'labor')
	const partsItems = approvedItems.filter(item => item.item_type === 'part')
	const expensesItems = approvedItems.filter(item => item.item_type === 'expense')
	const servicesItems = approvedItems.filter(item => item.item_type === 'service')
	const feesItems = approvedItems.filter(item => item.item_type === 'fee')
	const discountsItems = approvedItems.filter(item => item.item_type === 'discount')
	const packagesItems = approvedItems.filter(item => item.item_type === 'package')
	
	// Calculate totals for approved items only
	// All line amounts go through getLineTotal (labor: hours × rate, others: qty × price;
	// discounts are positive amounts subtracted below)
	const sumLines = (list: WorkOrderItem[]) => list.reduce((sum, item) => sum + getLineTotal(item), 0)

	const labourTotal = sumLines(labourItems)
	const partsTotal = sumLines(partsItems)

	// Expenses are excluded from calculations (tracking only)
	const expensesTotal = 0

	const servicesTotal = sumLines(servicesItems)
	const feesTotal = sumLines(feesItems)
	const discountsTotal = sumLines(discountsItems)
	const packagesTotal = sumLines(packagesItems)
	
	// Subtract discounts from subtotal (discounts reduce the total)
	// Expenses are excluded from subtotal calculation (tracking only)
	const subtotal = labourTotal + partsTotal + servicesTotal + feesTotal + packagesTotal - discountsTotal
	
	return {
		subtotal,
		labourTotal,
		partsTotal,
		expensesTotal,
		servicesTotal,
		feesTotal,
		discountsTotal,
		packagesTotal,
		approvedItems,
		rejectedItems,
		labourItems,
		partsItems,
		expensesItems,
		servicesItems,
		feesItems,
		discountsItems,
		packagesItems
	}
}

/**
 * Convert InvoiceItem[] to WorkOrderItem[] format for use with calculateInvoiceTotals
 * This allows us to use the centralized calculation logic for manual invoice creation
 */
export function convertInvoiceItemsToWorkOrderItems(
	invoiceItems: InvoiceItem[],
	workOrderId?: string,
	shopId?: string
): WorkOrderItem[] {
	return invoiceItems.map((item) => ({
		id: item.id,
		work_order_id: workOrderId || item.id, // Use item.id as fallback if no work_order_id
		shop_id: shopId || '', // Empty string fallback
		item_type: item.item_type,
		description: item.description,
		quantity: item.quantity,
		unit_price: item.unit_price,
		total_price: item.total_price,
		part_number: item.part_number,
		supplier: item.supplier,
		category: item.category,
		warranty_period: item.warranty_period,
		labor_hours: item.labor_hours,
		technician_id: item.technician_id,
		active: (item as any).active !== false ? true : false, // Default to true if not explicitly false
		created_at: new Date().toISOString(),
		// Include optional fields that might exist
		unit_cost: (item as any).unit_cost,
		total_cost: (item as any).total_cost,
		notes: (item as any).notes,
		is_billable: (item as any).is_billable !== false ? true : undefined, // Default to true if not explicitly false
	} as WorkOrderItem))
}

/**
 * Format invoice display ID with proper fallback handling.
 * Handles cases where display_id might be "0", null, undefined, or empty string.
 * 
 * @param displayId - The invoice display_id (e.g., "INV-001")
 * @param invoiceNumber - The fallback invoice_number (e.g., "INV-20240126-ABC12345")
 * @returns The formatted display ID for UI display
 */
export function formatInvoiceDisplayId(
	displayId: string | null | undefined,
	invoiceNumber: string | null | undefined
): string {
	// Check if display_id is valid (not null, undefined, empty string, or "0")
	const isValidDisplayId = displayId && 
		displayId.trim() !== '' && 
		displayId !== '0' &&
		!displayId.startsWith('0') // Exclude display_ids that start with "0" (like "0123")
	
	if (isValidDisplayId) {
		return displayId
	}
	
	// Fall back to invoice_number
	if (invoiceNumber && invoiceNumber.trim() !== '') {
		return invoiceNumber
	}
	
	// Final fallback
	return 'N/A'
}
