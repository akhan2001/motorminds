import { z } from 'zod'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { createClient } from '@/utils/supabase/server'
import { computeInvoiceTotals, computeLineTotal, formatCurrency, suggestLineItemPrice } from '@/lib/invoices/compute-totals'
import type { CreateInvoice, InvoiceLineItem, Customer, Vehicle } from './schemas'

// Search customers tool
export const searchCustomersTool = new DynamicStructuredTool({
    name: 'search_customers',
    description: 'Search for existing customers by name, email, or phone number',
    schema: z.object({
        query: z.string().describe('Search query (name, email, or phone)'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    func: async ({ query, limit = 10 }) => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('customers')
            .select('id, first_name, last_name, email, phone_number, address, city, province, postal_code')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
            .limit(limit)
            
        if (error) {
            return `Error searching customers: ${error.message}`
        }
        
        if (!data || data.length === 0) {
            return 'No customers found matching the search criteria.'
        }
        
        return JSON.stringify(data.map(customer => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            phone: customer.phone_number,
            address: `${customer.address || ''}, ${customer.city || ''}, ${customer.province || ''} ${customer.postal_code || ''}`.trim()
        })))
    }
})

// Search vehicles tool
export const searchVehiclesTool = new DynamicStructuredTool({
    name: 'search_vehicles',
    description: 'Search for vehicles by customer ID, make, model, year, or VIN',
    schema: z.object({
        customer_id: z.string().optional().describe('Customer ID to filter vehicles'),
        query: z.string().optional().describe('Search query (make, model, year, VIN, license plate)'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    func: async ({ customer_id, query, limit = 10 }) => {
        const supabase = await createClient()
        
        let queryBuilder = supabase
            .from('customer_vehicles')
            .select(`
                id, year, make, model, vin, license_plate, color, engine, transmission, mileage,
                customers!inner(first_name, last_name, email)
            `)
            .limit(limit)
            
        if (customer_id) {
            queryBuilder = queryBuilder.eq('customer_id', customer_id)
        }
        
        if (query) {
            queryBuilder = queryBuilder.or(
                `make.ilike.%${query}%,model.ilike.%${query}%,vin.ilike.%${query}%,license_plate.ilike.%${query}%,year.eq.${parseInt(query) || 0}`
            )
        }
        
        const { data, error } = await queryBuilder
            
        if (error) {
            return `Error searching vehicles: ${error.message}`
        }
        
        if (!data || data.length === 0) {
            return 'No vehicles found matching the search criteria.'
        }
        
        return JSON.stringify(data.map(vehicle => ({
            id: vehicle.id,
            vehicle_info: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vin: vehicle.vin,
            license_plate: vehicle.license_plate,
            color: vehicle.color,
            mileage: vehicle.mileage,
            owner: `${vehicle.customers.first_name} ${vehicle.customers.last_name}`,
            owner_email: vehicle.customers.email
        })))
    }
})

// Create customer tool
export const createCustomerTool = new DynamicStructuredTool({
    name: 'create_customer',
    description: 'Create a new customer record',
    schema: z.object({
        first_name: z.string().describe('Customer first name'),
        last_name: z.string().describe('Customer last name'),
        email: z.string().email().optional().describe('Customer email'),
        phone_number: z.string().optional().describe('Customer phone number'),
        address: z.string().optional().describe('Street address'),
        city: z.string().optional().describe('City'),
        province: z.string().optional().describe('Province/State'),
        postal_code: z.string().optional().describe('Postal/ZIP code')
    }),
    func: async (customerData) => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single()
            
        if (error) {
            return `Error creating customer: ${error.message}`
        }
        
        return JSON.stringify({
            success: true,
            customer_id: data.id,
            message: `Customer "${customerData.first_name} ${customerData.last_name}" created successfully.`,
            customer: data
        })
    }
})

// Create vehicle tool
export const createVehicleTool = new DynamicStructuredTool({
    name: 'create_vehicle',
    description: 'Create a new vehicle record for a customer',
    schema: z.object({
        customer_id: z.string().describe('Customer ID who owns the vehicle'),
        year: z.number().int().min(1900).describe('Vehicle year'),
        make: z.string().describe('Vehicle make (e.g., Toyota, Ford)'),
        model: z.string().describe('Vehicle model (e.g., Camry, F-150)'),
        vin: z.string().optional().describe('Vehicle VIN number'),
        license_plate: z.string().optional().describe('License plate number'),
        color: z.string().optional().describe('Vehicle color'),
        engine: z.string().optional().describe('Engine type/size'),
        transmission: z.string().optional().describe('Transmission type'),
        mileage: z.number().int().min(0).optional().describe('Current mileage')
    }),
    func: async (vehicleData) => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('customer_vehicles')
            .insert(vehicleData)
            .select()
            .single()
            
        if (error) {
            return `Error creating vehicle: ${error.message}`
        }
        
        return JSON.stringify({
            success: true,
            vehicle_id: data.id,
            message: `Vehicle "${vehicleData.year} ${vehicleData.make} ${vehicleData.model}" created successfully.`,
            vehicle: data
        })
    }
})

// Calculate invoice totals tool
export const calculateInvoiceTotalsTool = new DynamicStructuredTool({
    name: 'calculate_invoice_totals',
    description: 'Calculate totals for invoice line items including subtotal, tax, and total',
    schema: z.object({
        line_items: z.array(z.object({
            description: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            category: z.enum(['parts', 'labor', 'service', 'other']).optional()
        })).describe('Array of line items'),
        discount_amount: z.number().optional().default(0).describe('Discount amount to apply'),
        tax_rate: z.number().optional().default(0.13).describe('Tax rate (default 13% HST)')
    }),
    func: async ({ line_items, discount_amount = 0, tax_rate = 0.13 }) => {
        // Calculate line totals for each item
        const itemsWithTotals: InvoiceLineItem[] = line_items.map(item => ({
            ...item,
            category: item.category || 'service',
            line_total: computeLineTotal(item.quantity, item.unit_price)
        }))
        
        // Calculate invoice totals
        const totals = computeInvoiceTotals({
            line_items: itemsWithTotals,
            discount_amount,
            tax_rate
        })
        
        return JSON.stringify({
            line_items: itemsWithTotals,
            totals: {
                subtotal: formatCurrency(totals.subtotal),
                discount_amount: formatCurrency(totals.discount_amount),
                tax_amount: formatCurrency(totals.tax_amount),
                total: formatCurrency(totals.total)
            },
            totals_raw: totals
        })
    }
})

// Suggest line item pricing tool
export const suggestPricingTool = new DynamicStructuredTool({
    name: 'suggest_pricing',
    description: 'Suggest pricing for a line item based on category and description',
    schema: z.object({
        category: z.enum(['parts', 'labor', 'service', 'other']).describe('Category of the line item'),
        description: z.string().describe('Description of the work or part'),
        quantity: z.number().optional().default(1).describe('Quantity (for context)')
    }),
    func: async ({ category, description, quantity = 1 }) => {
        const suggested_price = suggestLineItemPrice(category, description, quantity)
        
        return JSON.stringify({
            category,
            description,
            suggested_unit_price: suggested_price,
            formatted_price: formatCurrency(suggested_price),
            note: suggested_price === 0 ? 
                'Manual pricing required - please set appropriate price for this item' : 
                'Suggested price based on category and description'
        })
    }
})

// Search existing invoices tool
export const searchInvoicesTool = new DynamicStructuredTool({
    name: 'search_invoices',
    description: 'Search for existing invoices by customer, vehicle, or other criteria',
    schema: z.object({
        customer_name: z.string().optional().describe('Customer name to search'),
        vehicle_info: z.string().optional().describe('Vehicle year/make/model to search'),
        status: z.enum(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']).optional().describe('Invoice status'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    func: async ({ customer_name, vehicle_info, status, limit = 10 }) => {
        const supabase = await createClient()
        
        let queryBuilder = supabase
            .from('invoices')
            .select(`
                id, invoice_number, status, total_amount, created_at, due_date,
                customers!inner(first_name, last_name, email),
                customer_vehicles!inner(year, make, model, license_plate)
            `)
            .limit(limit)
            .order('created_at', { ascending: false })
            
        if (status) {
            queryBuilder = queryBuilder.eq('status', status)
        }
        
        if (customer_name) {
            queryBuilder = queryBuilder.or(
                `customers.first_name.ilike.%${customer_name}%,customers.last_name.ilike.%${customer_name}%`
            )
        }
        
        if (vehicle_info) {
            queryBuilder = queryBuilder.or(
                `customer_vehicles.make.ilike.%${vehicle_info}%,customer_vehicles.model.ilike.%${vehicle_info}%,customer_vehicles.year.eq.${parseInt(vehicle_info) || 0}`
            )
        }
        
        const { data, error } = await queryBuilder
            
        if (error) {
            return `Error searching invoices: ${error.message}`
        }
        
        if (!data || data.length === 0) {
            return 'No invoices found matching the search criteria.'
        }
        
        return JSON.stringify(data.map(invoice => ({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            total_amount: formatCurrency(invoice.total_amount || 0),
            customer: `${invoice.customers[0].first_name} ${invoice.customers[0].last_name}`,
            customer_email: invoice.customers.email,
            vehicle: `${invoice.customer_vehicles.year} ${invoice.customer_vehicles.make} ${invoice.customer_vehicles.model}`,
            license_plate: invoice.customer_vehicles.license_plate,
            created_at: invoice.created_at,
            due_date: invoice.due_date
        })))
    }
})

// Create invoice tool
export const createInvoiceTool = new DynamicStructuredTool({
    name: 'create_invoice',
    description: 'Create a new invoice with line items, customer, and vehicle information',
    schema: z.object({
        customer_id: z.string().describe('Customer ID'),
        vehicle_id: z.string().describe('Vehicle ID'),
        line_items: z.array(z.object({
            description: z.string(),
            quantity: z.number(),
            unit_price: z.number(),
            category: z.enum(['parts', 'labor', 'service', 'other']).optional().default('service')
        })).describe('Invoice line items'),
        notes: z.string().optional().describe('Customer-visible notes'),
        internal_notes: z.string().optional().describe('Internal notes'),
        discount_amount: z.number().optional().default(0).describe('Discount amount'),
        tax_rate: z.number().optional().default(0.13).describe('Tax rate'),
        due_date: z.string().optional().describe('Due date (YYYY-MM-DD)')
    }),
    func: async ({ customer_id, vehicle_id, line_items, notes, internal_notes, discount_amount = 0, tax_rate = 0.13, due_date }) => {
        const supabase = await createClient()
        
        try {
            // Calculate totals
            const itemsWithTotals: InvoiceLineItem[] = line_items.map(item => ({
                ...item,
                category: item.category || 'service',
                line_total: computeLineTotal(item.quantity, item.unit_price)
            }))
            
            const totals = computeInvoiceTotals({
                line_items: itemsWithTotals,
                discount_amount,
                tax_rate
            })
            
            // Generate invoice number (simple increment for now)
            const { data: lastInvoice } = await supabase
                .from('invoices')
                .select('invoice_number')
                .order('created_at', { ascending: false })
                .limit(1)
                
            let next_number = 1
            if (lastInvoice && lastInvoice.length > 0 && lastInvoice[0].invoice_number) {
                const match = lastInvoice[0].invoice_number.match(/(\d+)$/)
                if (match) {
                    next_number = parseInt(match[1]) + 1
                }
            }
            const invoice_number = `INV-${next_number.toString().padStart(4, '0')}`
            
            // Create invoice
            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    invoice_number,
                    customer_id,
                    vehicle_id,
                    status: 'draft',
                    subtotal: totals.subtotal,
                    discount_amount: totals.discount_amount,
                    tax_amount: totals.tax_amount,
                    total_amount: totals.total,
                    tax_rate,
                    notes,
                    internal_notes,
                    due_date
                })
                .select()
                .single()
                
            if (invoiceError) {
                return `Error creating invoice: ${invoiceError.message}`
            }
            
            // Create line items
            const line_items_data = itemsWithTotals.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total,
                category: item.category
            }))
            
            const { error: itemsError } = await supabase
                .from('invoice_line_items')
                .insert(line_items_data)
                
            if (itemsError) {
                return `Error creating invoice line items: ${itemsError.message}`
            }
            
            return JSON.stringify({
                success: true,
                invoice_id: invoice.id,
                invoice_number,
                message: `Invoice ${invoice_number} created successfully`,
                totals: {
                    subtotal: formatCurrency(totals.subtotal),
                    discount_amount: formatCurrency(totals.discount_amount),
                    tax_amount: formatCurrency(totals.tax_amount),
                    total: formatCurrency(totals.total)
                }
            })
            
        } catch (error) {
            return `Error creating invoice: ${error}`
        }
    }
})

// Send invoice tool
export const sendInvoiceTool = new DynamicStructuredTool({
    name: 'send_invoice',
    description: 'Send an invoice to a customer via email using invoice display ID (like INV-209) or invoice number (UUID)',
    schema: z.object({
        invoiceIdentifier: z.string().describe('Invoice display ID (like INV-209, INV-0001) or invoice number (UUID) - the system will auto-detect which type it is'),
        recipientEmail: z.string().email().optional().describe('Override recipient email (uses customer email by default)')
    }),
    func: async ({ invoiceIdentifier, recipientEmail }) => {
        try {
            // Call the centralized send invoice API
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoiceIdentifier,
                    type: 'auto', // Auto-detect the identifier type
                    recipientEmail // Optional override
                })
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                return `Error sending invoice: ${result.error || 'Unknown error occurred'}${result.details ? ` - ${result.details}` : ''}`
            }
            
            const { data } = result
            return JSON.stringify({
                success: true,
                message: `Invoice ${data.displayId || data.invoiceId} has been successfully sent to ${data.recipientEmail}.`,
                invoice_id: data.invoiceId,
                display_id: data.displayId,
                recipient_email: data.recipientEmail,
                email_id: data.emailId,
                sent_at: data.sentAt
            })
            
        } catch (error) {
            return `Error sending invoice ${invoiceIdentifier}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
})

// Update invoice status tool
export const updateInvoiceStatusTool = new DynamicStructuredTool({
    name: 'update_invoice_status',
    description: 'Update the status of an existing invoice',
    schema: z.object({
        invoiceIdentifier: z.string().describe('Invoice display ID or invoice number (UUID)'),
        status: z.enum(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']).describe('New invoice status'),
        notes: z.string().optional().describe('Optional notes about the status change')
    }),
    func: async ({ invoiceIdentifier, status, notes }) => {
        const supabase = await createClient()
        
        try {
            // Auto-detect identifier type and find invoice
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceIdentifier)
            
            let query = supabase
                .from('invoices')
                .select('id, invoice_number, display_id, status, client_name')
            
            if (isUUID) {
                query = query.eq('invoice_number', invoiceIdentifier)
            } else {
                query = query.eq('display_id', invoiceIdentifier)
            }
            
            const { data: invoice, error: findError } = await query.single()
            
            if (findError || !invoice) {
                return `Invoice not found: ${invoiceIdentifier}`
            }
            
            // Update the invoice status
            const updateData: any = { status }
            if (notes) {
                updateData.status_notes = notes
            }
            
            const { error: updateError } = await supabase
                .from('invoices')
                .update(updateData)
                .eq('id', invoice.id)
            
            if (updateError) {
                return `Error updating invoice status: ${updateError.message}`
            }
            
            return JSON.stringify({
                success: true,
                message: `Invoice ${invoice.display_id || invoice.invoice_number} status updated to "${status}"`,
                invoice_id: invoice.invoice_number,
                display_id: invoice.display_id,
                previous_status: invoice.status,
                new_status: status,
                customer: invoice.client_name
            })
            
        } catch (error) {
            return `Error updating invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
})

// Export all tools
export const invoiceTools = [
    searchCustomersTool,
    searchVehiclesTool,
    createCustomerTool,
    createVehicleTool,
    calculateInvoiceTotalsTool,
    suggestPricingTool,
    searchInvoicesTool,
    createInvoiceTool,
    sendInvoiceTool,
    updateInvoiceStatusTool
]
