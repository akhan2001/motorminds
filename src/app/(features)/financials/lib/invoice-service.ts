import { supabase } from '@/lib/supabase'
import { Invoice, InvoiceFormData } from '../types/invoice'
import { WorkOrderItem } from '../../operations/types/work-order-items'

export interface WorkOrderInvoiceData {
	work_order_id: string
	customer_id: string
	vehicle_id: string
	shop_id: string
	amount: number
	labour_total_price?: number
	parts_total_price?: number
	status: 'PAID' | 'UNPAID'
	source: 'customer_generated' | 'shop_generated'
	workOrderItems: WorkOrderItem[]
}

export async function createInvoiceFromWorkOrder(invoiceData: WorkOrderInvoiceData): Promise<Invoice> {
	try {
		// Separate work order items by type
		const labourItems = invoiceData.workOrderItems.filter(item => item.item_type === 'labor')
		const partsItems = invoiceData.workOrderItems.filter(item => item.item_type === 'part')
		
		// Create the invoice - only essential columns needed
		const { data: invoice, error: invoiceError } = await supabase
			.from('invoices')
			.insert({
				work_order_id: invoiceData.work_order_id,
				customer_id: invoiceData.customer_id,
				vehicle_id: invoiceData.vehicle_id,
				shop_id: invoiceData.shop_id,
				amount: invoiceData.amount,
				labour_total_price: invoiceData.labour_total_price,
				parts_total_price: invoiceData.parts_total_price,
				status: invoiceData.status,
				source: invoiceData.source,
				labour_items: labourItems,
				parts_items: partsItems
			})
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

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
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

export async function updateInvoice(invoiceId: string, updates: Partial<InvoiceFormData>): Promise<Invoice | null> {
	try {
		const { data, error } = await supabase
			.from('invoices')
			.update(updates)
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

export async function deleteInvoice(invoiceId: string): Promise<boolean> {
	try {
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