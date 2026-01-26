import { WorkOrderItem } from '../../operations/types/work-order-items'

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
	const labourTotal = labourItems.reduce((sum, item) => {
		// For labor: labor_hours * unit_price
		const total = (item.labor_hours || 0) * (item.unit_price || 0)
		return sum + total
	}, 0)
	
	const partsTotal = partsItems.reduce((sum, item) => {
		// For parts: quantity * unit_price
		const total = (item.quantity || 0) * (item.unit_price || 0)
		return sum + total
	}, 0)
	
	// Expenses are excluded from calculations (tracking only)
	const expensesTotal = 0
	
	const servicesTotal = servicesItems.reduce((sum, item) => {
		// For services: quantity * unit_price
		const total = (item.quantity || 0) * (item.unit_price || 0)
		return sum + total
	}, 0)
	
	const feesTotal = feesItems.reduce((sum, item) => {
		// For fees: quantity * unit_price
		const total = (item.quantity || 0) * (item.unit_price || 0)
		return sum + total
	}, 0)
	
	const discountsTotal = discountsItems.reduce((sum, item) => {
		// For discounts: quantity * unit_price (always use positive values)
		// Discounts are stored as positive values and subtracted in calculations
		const unitPrice = Math.abs(item.unit_price || 0)
		const total = (item.quantity || 0) * unitPrice
		return sum + total
	}, 0)
	
	const packagesTotal = packagesItems.reduce((sum, item) => {
		// For packages: quantity * unit_price
		const total = (item.quantity || 0) * (item.unit_price || 0)
		return sum + total
	}, 0)
	
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
 * Get items for invoice display (approved items only)
 */
export function getInvoiceItems(workOrderItems: WorkOrderItem[]): {
	labourItems: WorkOrderItem[]
	partsItems: WorkOrderItem[]
	servicesItems: WorkOrderItem[]
	feesItems: WorkOrderItem[]
} {
	const approvedItems = workOrderItems.filter(item => item.active !== false)
	
	return {
		labourItems: approvedItems.filter(item => item.item_type === 'labor'),
		partsItems: approvedItems.filter(item => item.item_type === 'part'),
		servicesItems: approvedItems.filter(item => item.item_type === 'service'),
		feesItems: approvedItems.filter(item => item.item_type === 'fee')
	}
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
