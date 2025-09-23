// Example usage of the invoice temporary service
// This file shows how to use the invoice service with work orders

import { createInvoiceFromWorkOrder, WorkOrderInvoiceData, LegacyInvoice } from './invoice-temp-service'
import { WorkOrderItem } from '../../operations/types/work-order-items'

// Example function to create an invoice from a completed work order
export async function createInvoiceExample(
    workOrderId: string,
    customerId: string,
    vehicleId: string,
    shopId: string,
    workOrderItems: WorkOrderItem[]
): Promise<LegacyInvoice> {
    
    // Prepare the invoice data
    const invoiceData: WorkOrderInvoiceData = {
        work_order_id: workOrderId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        shop_id: shopId,
        status: 'UNPAID', // Start as unpaid
        source: 'shop_generated',
        workOrderItems: workOrderItems,
        
        // Optional customer information (can be fetched from database)
        client_name: 'John Doe',
        client_email: 'john@example.com',
        client_phone: '(555) 123-4567',
        client_address: '123 Main St, City, State 12345',
        
        // Optional shop information
        shop_name: 'MotorMinds Auto Shop',
        shop_email: 'info@motorminds.com',
        shop_phone: '(555) 987-6543',
        shop_address: '456 Auto Ave, City, State 12345',
        
        // Work order details
        description: 'Oil change and brake inspection',
        notes: 'Customer requested premium oil',
        customer_notes: 'Please call when ready',
        mileage: '85,000',
        assigned_to: 'Technician Mike'
    }

    try {
        const invoice = await createInvoiceFromWorkOrder(invoiceData)
        console.log('Invoice created successfully:', invoice.invoice_number)
        return invoice
    } catch (error) {
        console.error('Failed to create invoice:', error)
        throw error
    }
}

// Example of how to mark an invoice as paid
export async function markInvoicePaidExample(invoiceId: string) {
    const { markInvoiceAsPaid } = await import('./invoice-temp-service')
    
    try {
        const updatedInvoice = await markInvoiceAsPaid(invoiceId)
        if (updatedInvoice) {
            console.log('Invoice marked as paid:', updatedInvoice.invoice_number)
        }
    } catch (error) {
        console.error('Failed to mark invoice as paid:', error)
    }
}

// Example of how to get invoice statistics for a shop
export async function getShopInvoiceStatsExample(shopId: string) {
    const { getInvoiceStats } = await import('./invoice-temp-service')
    
    try {
        const stats = await getInvoiceStats(shopId)
        console.log('Invoice Stats:', stats)
        /*
        Output example:
        {
            totalInvoices: 150,
            paidInvoices: 120,
            unpaidInvoices: 30,
            totalRevenue: 45000.00,
            pendingRevenue: 8500.00
        }
        */
    } catch (error) {
        console.error('Failed to get invoice stats:', error)
    }
}
