import { supabase } from '@/lib/supabase'
import { WorkOrderItem } from '../../operations/types/work-order-items'
import { calculateInvoiceTotals, getInvoiceItems } from './invoice-calculations'

// Legacy invoice type based on old table structure
export interface LegacyInvoice {
	invoice_number: string
	work_order_id?: string
	workorder_id?: string
	customer_id?: string
	vehicle_id?: string
	shop_id?: string
	status?: string
	shop_name?: string
	shop_address?: string
	shop_email?: string
	shop_phone?: string
	amount?: number
	labour_total_price?: number
	parts_total_price?: number
	total_shop_cost?: number
	profit?: number
	estimated_amount?: number
	issue_date?: string
	paid_at?: string
	client_name?: string
	client_address?: string
	client_email?: string
	client_phone?: string
	labour?: string
	parts?: string
	notes?: string
	customer_notes?: string
	mileage?: string
	description?: string
	assigned_to?: string
	vehicle_information?: any
	display_id?: string
	invoice_display_props?: any
	labour_items?: any[]
	parts_items?: any[]
	source?: 'customer_generated' | 'shop_generated'
	created_at?: string
}

export interface WorkOrderInvoiceData {
	work_order_id: string
	customer_id: string
	vehicle_id?: string
	shop_id: string
	status: 'PAID' | 'UNPAID'
	source: 'customer_generated' | 'shop_generated'
	workOrderItems: WorkOrderItem[]
	// Optional customer/shop details
	client_name?: string
	client_email?: string
	client_phone?: string
	client_address?: string
	shop_name?: string
	shop_email?: string
	shop_phone?: string
	shop_address?: string
	vehicle_information?: any
	description?: string
	notes?: string
	customer_notes?: string
	mileage?: string
	assigned_to?: string
}

export async function createInvoiceFromWorkOrder(invoiceData: WorkOrderInvoiceData): Promise<LegacyInvoice> {
	try {
		// Calculate totals excluding rejected items
		const calculations = calculateInvoiceTotals(invoiceData.workOrderItems)
		
		// Get items for invoice display (approved items only)
		const invoiceItems = getInvoiceItems(invoiceData.workOrderItems)
		
		// Prepare invoice data for old table structure
		const invoicePayload: Partial<LegacyInvoice> = {
			work_order_id: invoiceData.work_order_id,
			customer_id: invoiceData.customer_id,
			vehicle_id: invoiceData.vehicle_id,
			shop_id: invoiceData.shop_id,
			amount: calculations.subtotal,
			labour_total_price: calculations.labourTotal,
			parts_total_price: calculations.partsTotal,
			total_shop_cost: 0, // Calculate separately if needed
			profit: 0, // Calculate separately if needed
			estimated_amount: calculations.subtotal,
			status: invoiceData.status,
			source: invoiceData.source,
			labour_items: invoiceItems.labourItems,
			parts_items: invoiceItems.partsItems,
			// Optional fields from invoiceData
			client_name: invoiceData.client_name,
			client_email: invoiceData.client_email,
			client_phone: invoiceData.client_phone,
			client_address: invoiceData.client_address,
			shop_name: invoiceData.shop_name,
			shop_email: invoiceData.shop_email,
			shop_phone: invoiceData.shop_phone,
			shop_address: invoiceData.shop_address,
			vehicle_information: invoiceData.vehicle_information,
			description: invoiceData.description,
			notes: invoiceData.notes,
			customer_notes: invoiceData.customer_notes,
			mileage: invoiceData.mileage,
			assigned_to: invoiceData.assigned_to,
			issue_date: new Date().toISOString()
		}

		// Remove undefined values to avoid insert issues
		const cleanPayload = Object.fromEntries(
			Object.entries(invoicePayload).filter(([_, value]) => value !== undefined)
		)
		
		// Create the invoice using old table structure
		const { data: invoice, error: invoiceError } = await supabase
			.from('invoices')
			.insert(cleanPayload)
			.select()
			.single()

		if (invoiceError) {
			console.error('Error creating invoice:', invoiceError)
			throw new Error(`Failed to create invoice: ${invoiceError.message}`)
		}

		// Update work_order_items with the new invoice_id
		const workOrderItemIds = invoiceData.workOrderItems.map(item => item.id)
		if (workOrderItemIds.length > 0) {
			const { error: updateItemsError } = await supabase
				.from('work_order_items')
				.update({ invoice_id: invoice.invoice_number })
				.in('id', workOrderItemIds)

			if (updateItemsError) {
				console.error('Error updating work order items with invoice_id:', updateItemsError)
				throw new Error(`Failed to update work order items: ${updateItemsError.message}`)
			}
		}

		// Update the work_orders table with the new invoice_id
		const { error: updateWorkOrderError } = await supabase
			.from('work_orders')
			.update({ invoice_id: invoice.invoice_number })
			.eq('id', invoiceData.work_order_id)

		if (updateWorkOrderError) {
			console.error('Error updating work order with invoice_id:', updateWorkOrderError)
			throw new Error(`Failed to update work order: ${updateWorkOrderError.message}`)
		}

		return invoice
	} catch (error: any) {
		console.error('Failed to create invoice from work order:', error)
		throw error
	}
}

export async function getInvoice(invoiceId: string): Promise<LegacyInvoice | null> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('*')
			.eq('invoice_number', invoiceId)
			.single()

		if (error) {
			console.error('Error fetching invoice:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('Failed to fetch invoice:', error)
		return null
	}
}

export async function getInvoicesByShop(shopId: string): Promise<LegacyInvoice[]> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('*')
			.eq('shop_id', shopId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching invoices:', error)
			return []
		}

		return data || []
	} catch (error) {
		console.error('Failed to fetch invoices:', error)
		return []
	}
}

export async function getInvoicesByWorkOrder(workOrderId: string): Promise<LegacyInvoice[]> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('*')
			.eq('work_order_id', workOrderId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error fetching invoices:', error)
			return []
		}

		return data || []
	} catch (error) {
		console.error('Failed to fetch invoices:', error)
		return []
	}
}

export async function updateInvoice(invoiceId: string, updates: Partial<LegacyInvoice>): Promise<LegacyInvoice | null> {
	try {
		// Remove undefined values to avoid update issues
		const cleanUpdates = Object.fromEntries(
			Object.entries(updates).filter(([_, value]) => value !== undefined)
		)

		const { data, error } = await supabase
			.from('invoices')
			.update(cleanUpdates)
			.eq('invoice_number', invoiceId)
			.select()
			.single()

		if (error) {
			console.error('Error updating invoice:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('Failed to update invoice:', error)
		return null
	}
}

export async function markInvoiceAsPaid(invoiceId: string, paymentDate?: string): Promise<LegacyInvoice | null> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.update({
				status: 'PAID',
				paid_at: paymentDate || new Date().toISOString()
			})
			.eq('invoice_number', invoiceId)
			.select()
			.single()

		if (error) {
			console.error('Error marking invoice as paid:', error)
			return null
		}

		return data
	} catch (error) {
		console.error('Failed to mark invoice as paid:', error)
		return null
	}
}

export async function deleteInvoice(invoiceId: string): Promise<boolean> {
	try {
		// First remove invoice_id references from work_order_items
		const { error: updateItemsError } = await supabase
			.from('work_order_items')
			.update({ invoice_id: null })
			.eq('invoice_id', invoiceId)

		if (updateItemsError) {
			console.error('Error removing invoice_id from work order items:', updateItemsError)
		}

		// Remove invoice_id reference from work_orders
		const { error: updateWorkOrderError } = await supabase
			.from('work_orders')
			.update({ invoice_id: null })
			.eq('invoice_id', invoiceId)

		if (updateWorkOrderError) {
			console.error('Error removing invoice_id from work order:', updateWorkOrderError)
		}

		// Delete the invoice
		const { error } = await supabase
			.from('invoices')
			.delete()
			.eq('invoice_number', invoiceId)

		if (error) {
			console.error('Error deleting invoice:', error)
			return false
		}

		return true
	} catch (error) {
		console.error('Failed to delete invoice:', error)
		return false
	}
}

// Additional utility functions for legacy invoice management

export async function getInvoiceStats(shopId: string): Promise<{
	totalInvoices: number
	paidInvoices: number
	unpaidInvoices: number
	totalRevenue: number
	pendingRevenue: number
}> {
	try {
		const { data: invoices, error } = await supabase
			.from('invoices')
			.select('status, amount')
			.eq('shop_id', shopId)

		if (error) {
			console.error('Error fetching invoice stats:', error)
			return {
				totalInvoices: 0,
				paidInvoices: 0,
				unpaidInvoices: 0,
				totalRevenue: 0,
				pendingRevenue: 0
			}
		}

		const stats = (invoices || []).reduce((acc, invoice) => {
			acc.totalInvoices++
			const amount = invoice.amount || 0
			
			if (invoice.status === 'PAID') {
				acc.paidInvoices++
				acc.totalRevenue += amount
			} else {
				acc.unpaidInvoices++
				acc.pendingRevenue += amount
			}
			
			return acc
		}, {
			totalInvoices: 0,
			paidInvoices: 0,
			unpaidInvoices: 0,
			totalRevenue: 0,
			pendingRevenue: 0
		})

		return stats
	} catch (error) {
		console.error('Failed to fetch invoice stats:', error)
		return {
			totalInvoices: 0,
			paidInvoices: 0,
			unpaidInvoices: 0,
			totalRevenue: 0,
			pendingRevenue: 0
		}
	}
}

export async function searchInvoices(shopId: string, searchTerm: string): Promise<LegacyInvoice[]> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.select('*')
			.eq('shop_id', shopId)
			.or(`client_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,customer_notes.ilike.%${searchTerm}%`)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error searching invoices:', error)
			return []
		}

		return data || []
	} catch (error) {
		console.error('Failed to search invoices:', error)
		return []
	}
}