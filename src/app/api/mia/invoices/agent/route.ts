import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToCoreMessages, streamText, generateText, tool } from 'ai'
import { z } from 'zod'

// Initialize OpenAI
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// Set maximum duration for agent operations
export const maxDuration = 60

// Simple error handler
const handleError = (error: any) => {
    console.error('Agent error:', error)
    return 'An error occurred while processing your request. Please try again.'
}

// Define tools using pure Vercel AI SDK
const searchCustomers = tool({
    description: 'Search for existing customers by name, email, or phone number',
    parameters: z.object({
        query: z.string().describe('Search query (name, email, or phone)'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    execute: async ({ query, limit = 10 }) => {
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
        
        return data.map(customer => ({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`,
            email: customer.email,
            phone: customer.phone_number,
            address: `${customer.address || ''}, ${customer.city || ''}, ${customer.province || ''} ${customer.postal_code || ''}`.trim()
        }))
    }
})

const searchVehicles = tool({
    description: 'Search for vehicles by customer ID, make, model, year, or VIN',
    parameters: z.object({
        customer_id: z.string().optional().describe('Customer ID to filter vehicles'),
        query: z.string().optional().describe('Search query (make, model, year, VIN, license plate)'),
        limit: z.number().optional().default(10).describe('Maximum number of results')
    }),
    execute: async ({ customer_id, query, limit = 10 }) => {
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
        
        return data.map(vehicle => ({
            id: vehicle.id,
            vehicle_info: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            vin: vehicle.vin,
            license_plate: vehicle.license_plate,
            color: vehicle.color,
            mileage: vehicle.mileage,
            owner: `${(vehicle.customers as any).first_name} ${(vehicle.customers as any).last_name}`,
            owner_email: (vehicle.customers as any).email
        }))
    }
})

const createCustomer = tool({
    description: 'Create a new customer record',
    parameters: z.object({
        first_name: z.string().describe('Customer first name'),
        last_name: z.string().describe('Customer last name'),
        email: z.string().email().optional().describe('Customer email'),
        phone_number: z.string().optional().describe('Customer phone number'),
        address: z.string().optional().describe('Street address'),
        city: z.string().optional().describe('City'),
        province: z.string().optional().describe('Province/State'),
        postal_code: z.string().optional().describe('Postal/ZIP code')
    }),
    execute: async (customerData) => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single()
            
        if (error) {
            return `Error creating customer: ${error.message}`
        }
        
        return {
            success: true,
            customer_id: data.id,
            message: `Customer "${customerData.first_name} ${customerData.last_name}" created successfully.`,
            customer: data
        }
    }
})

const createVehicle = tool({
    description: 'Create a new vehicle record for a customer',
    parameters: z.object({
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
    execute: async (vehicleData) => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
            .from('customer_vehicles')
            .insert(vehicleData)
            .select()
            .single()
            
        if (error) {
            return `Error creating vehicle: ${error.message}`
        }
        
        return {
            success: true,
            vehicle_id: data.id,
            message: `Vehicle "${vehicleData.year} ${vehicleData.make} ${vehicleData.model}" created successfully.`,
            vehicle: data
        }
    }
})

const createInvoice = tool({
    description: 'Create a new invoice for a customer and vehicle with line items',
    parameters: z.object({
        customer_id: z.string().describe('Customer ID'),
        vehicle_id: z.string().describe('Vehicle ID'),
        line_items: z.array(z.object({
            description: z.string().describe('Description of the service or part'),
            quantity: z.number().describe('Quantity'),
            unit_price: z.number().describe('Unit price in dollars'),
            category: z.enum(['parts', 'labor', 'service', 'other']).optional().default('service')
        })).describe('Invoice line items'),
        notes: z.string().optional().describe('Customer-visible notes'),
        internal_notes: z.string().optional().describe('Internal notes'),
        discount_amount: z.number().optional().default(0).describe('Discount amount'),
        due_date: z.string().optional().describe('Due date (YYYY-MM-DD)')
    }),
    execute: async ({ customer_id, vehicle_id, line_items, notes, internal_notes, discount_amount = 0, due_date }) => {
        const supabase = await createClient()
        
        try {
            // Calculate line totals
            const itemsWithTotals = line_items.map(item => ({
                ...item,
                category: item.category || 'service',
                line_total: item.quantity * item.unit_price
            }))
            
            // Calculate totals
            const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.line_total, 0)
            const discounted_subtotal = subtotal - discount_amount
            const tax_rate = 0.13 // HST for Ontario
            const tax_amount = discounted_subtotal * tax_rate
            const total = discounted_subtotal + tax_amount
            
            // Generate invoice number
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
                    subtotal,
                    discount_amount,
                    tax_amount,
                    total_amount: total,
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
            
            return {
                success: true,
                invoice_id: invoice.id,
                invoice_number,
                message: `Invoice ${invoice_number} created successfully`,
                totals: {
                    subtotal: `$${subtotal.toFixed(2)}`,
                    discount_amount: `$${discount_amount.toFixed(2)}`,
                    tax_amount: `$${tax_amount.toFixed(2)}`,
                    total: `$${total.toFixed(2)}`
                }
            }
            
        } catch (error) {
            return `Error creating invoice: ${error}`
        }
    }
})

// Send invoice tool using the existing email API
const sendInvoice = tool({
    description: 'Send an invoice to a customer via email using invoice display ID (like INV-209) or invoice number (UUID)',
    parameters: z.object({
        invoiceIdentifier: z.string().describe('Invoice display ID (like INV-209, INV-0001) or invoice number (UUID) - the system will auto-detect which type it is')
    }),
    execute: async ({ invoiceIdentifier }) => {
        try {
            console.log('Attempting to send invoice:', invoiceIdentifier)
            const supabase = await createClient()
            const { Resend } = await import('resend')
            const { generateInvoiceEmailHTML, generateInvoiceEmailSubject } = await import('@/lib/email-templates/invoice-email')
            const { config } = await import('@/lib/config')
            
            const resend = new Resend(config.email.resendApiKey)
            
            // Auto-detect identifier type and find invoice
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceIdentifier)
            
            let query = supabase
                .from('invoices')
                .select(`
                    *,
                    shops (
                        shop_name,
                        shop_address,
                        shop_email,
                        shop_phone
                    )
                `)
            
            if (isUUID) {
                query = query.eq('invoice_number', invoiceIdentifier)
            } else {
                query = query.eq('display_id', invoiceIdentifier)
            }
            
            const { data: invoice, error: invoiceError } = await query.single()
            
            if (invoiceError || !invoice) {
                return `Invoice not found: ${invoiceIdentifier}. Please check the invoice number and try again.`
            }
            
            if (!invoice.client_email) {
                return `Cannot send invoice ${invoice.display_id || invoice.invoice_number}: Customer email is missing. Please add an email address to the customer record first.`
            }
            
            // Create invoice view URL
            const invoiceUrl = `${config.app.baseUrl}/invoices?invoiceId=${invoice.invoice_number}`
            
            // Generate email content
            const emailHTML = generateInvoiceEmailHTML({
                invoice: {
                    invoice_number: invoice.invoice_number,
                    display_id: invoice.display_id,
                    client_name: invoice.client_name,
                    amount: invoice.amount,
                    issue_date: invoice.issue_date,
                    due_date: invoice.due_date,
                    notes: invoice.notes,
                    customer_notes: invoice.customer_notes,
                    source: invoice.source,
                    labour_total_price: invoice.labour_total_price,
                    parts_total_price: invoice.parts_total_price,
                    vehicle_information: invoice.vehicle_information
                },
                shop: {
                    shop_name: invoice.shops.shop_name,
                    shop_address: invoice.shops.shop_address,
                    shop_email: invoice.shops.shop_email,
                    shop_phone: invoice.shops.shop_phone
                },
                invoiceUrl
            })
            
            const emailSubject = generateInvoiceEmailSubject(
                invoice.shops.shop_name,
                invoice.display_id || invoice.invoice_number
            )
            
            // Send email
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: `${invoice.shops.shop_name} <noreply@${config.email.fromDomain}>`,
                to: [invoice.client_email],
                subject: emailSubject,
                html: emailHTML
            })
            
            if (emailError) {
                return `Error sending invoice email: ${emailError.message || 'Email service failed'}`
            }
            
            // Update invoice status to 'sent' if it was 'draft'
            if (invoice.status === 'draft') {
                await supabase
                    .from('invoices')
                    .update({ status: 'sent' })
                    .eq('invoice_number', invoice.invoice_number)
            }
            
            return `Invoice ${invoice.display_id || invoice.invoice_number} has been successfully sent to ${invoice.client_email}. Email ID: ${emailData?.id}`
            
        } catch (error) {
            console.error('Send invoice error:', error)
            return `Error sending invoice ${invoiceIdentifier}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }
    }
})

// Update invoice status tool
const updateInvoiceStatus = tool({
    description: 'Update the status of an existing invoice',
    parameters: z.object({
        invoiceIdentifier: z.string().describe('Invoice display ID or invoice number (UUID)'),
        status: z.enum(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']).describe('New invoice status'),
        notes: z.string().optional().describe('Optional notes about the status change')
    }),
    execute: async ({ invoiceIdentifier, status, notes }) => {
        try {
            const supabase = await createClient()
            
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
            
            return `Invoice ${invoice.display_id || invoice.invoice_number} status updated from "${invoice.status}" to "${status}"${notes ? ` with note: ${notes}` : ''}`
            
        } catch (error) {
            return `Error updating invoice status: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
})

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        
        // Handle Vercel AI SDK format - messages array
        const messages = body.messages || []
        const context = body.context || { shop_id: 'default-shop' }
        const streamResponse = body.stream !== false // Default to streaming unless explicitly disabled
        
        if (!messages.length) {
            return Response.json(
                { error: 'No messages provided' },
                { status: 400 }
            )
        }
        
        // Authenticate user and validate shop access
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // Get shop ID from users table (same approach as invoices page)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()
            
        if (userError || !userData?.shop_id) {
            console.log('No shop_id found in users table for user:', user.id)
            return Response.json({ error: 'No shop associated with user. Please complete shop setup.' }, { status: 403 })
        }
        
        // Get shop data from shops table
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('id, shop_name')
            .eq('id', userData.shop_id)
            .single()
            
        if (shopError || !shopData) {
            console.log('Shop not found in shops table:', userData.shop_id)
            return Response.json({ error: 'Shop data not found' }, { status: 403 })
        }
        
        // Create session ID for conversation continuity
        const sessionId = body.session_id || `${user.id}-${shopData.id}-${Date.now()}`
        
        try {
            const systemMessage = {
                role: 'system',
                content: `You are MIA (MotorMinds Intelligent Assistant), a helpful AI assistant for automotive shop management.

                You specialize in helping automotive shop staff with:
                - **Invoice Management**: Creating, editing, and sending invoices
                - **Customer Management**: Finding and managing customer information
                - **Vehicle Information**: Managing vehicle records and details
                - **Shop Operations**: Providing guidance on daily operations

                Current shop: ${shopData.shop_name}

                ## Available Tools:
                - **searchCustomers**: Find existing customers by name, email, or phone
                - **searchVehicles**: Find vehicles by customer, make, model, year, or VIN  
                - **createCustomer**: Create a new customer if they don't exist
                - **createVehicle**: Create a new vehicle record for a customer
                - **createInvoice**: Create a new invoice with line items for a customer and vehicle
                - **sendInvoice**: Send an invoice to a customer via email using the display ID (like INV-209)

                ## Workflow for Creating and Sending an Invoice:
                1. First, search for the customer using searchCustomers (create if needed with createCustomer)
                2. Then search for their vehicle using searchVehicles (create if needed with createVehicle)
                3. Create the invoice with line items using createInvoice
                4. Optionally send the invoice using sendInvoice with the display ID (e.g., INV-209)

                ## Important Notes:
                - You can use either display IDs (INV-209, INV-0001) or invoice numbers (UUIDs) for sending invoices and status updates - the system auto-detects which type you're using
                - After sending an invoice, the status is automatically updated to "sent"
                - You can manually update invoice statuses: draft, pending, sent, paid, overdue, cancelled
                - NEVER use UUID/database invoice_number when referring to invoices
                - When you create an invoice, you'll get back the invoice_number (human-readable display ID) - use that for sending

                ## Example Usage:
                - "Create an invoice for Abdullah Khan for bearing replacement" → Returns INV-025
                - "Send invoice INV-025 to the customer" → Sends email to Abdullah
                - "Send invoice INV-209" → Simple and clear for shop owners

                Always confirm details with the user before taking actions. Be helpful, professional, and guide users through each step.
                
                When you successfully complete an action, provide a clear summary with the results.`
            }

            if (streamResponse) {
                // Use streaming for real-time chat experience
                const result = await streamText({
                    model: openai('gpt-4o-mini'),
                    messages: convertToCoreMessages([systemMessage, ...messages]),
                    tools: {
                        searchCustomers,
                        searchVehicles,
                        createCustomer,
                        createVehicle,
                        createInvoice,
                        sendInvoice,
                        updateInvoiceStatus
                    },
                    maxSteps: 5,
                    temperature: 0.1,
                    maxTokens: 1500,
                })

                return result.toAIStreamResponse()
            } else {
                // Use generateText for complete agent workflow with detailed results
                const result = await generateText({
                    model: openai('gpt-4o-mini'),
                    messages: convertToCoreMessages([systemMessage, ...messages]),
                    tools: {
                        searchCustomers,
                        searchVehicles,
                        createCustomer,
                        createVehicle,
                        createInvoice,
                        sendInvoice,
                        updateInvoiceStatus
                    },
                    maxSteps: 5,
                    temperature: 0.1,
                    maxTokens: 1500,
                })

                // Return the final response with tool usage details
                return Response.json({
                    text: result.text,
                    toolCalls: result.steps.flatMap(step => step.toolCalls || []),
                    toolResults: result.steps.flatMap(step => step.toolResults || []),
                    usage: result.usage,
                    steps: result.steps.length
                })
            }
            
        } catch (agentError) {
            const errorMessage = handleError(agentError)
            
            return Response.json({ 
                error: 'Processing error', 
                message: errorMessage 
            }, { status: 500 })
        }
        
    } catch (error) {
        console.error('API route error:', error)
        return Response.json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again.'
        }, { status: 500 })
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

// Health check endpoint
export async function GET(request: NextRequest) {
    try {
        // Basic connectivity test
        const supabase = await createClient()
        const { error } = await supabase.from('shop_info').select('id').limit(1)
        
        if (error) {
            return Response.json({ 
                status: 'error', 
                message: 'Database connectivity issue' 
            }, { status: 503 })
        }
        
        return Response.json({ 
            status: 'healthy',
            service: 'MIA Invoice Agent',
            timestamp: new Date().toISOString()
        })
        
    } catch (error) {
        return Response.json({ 
            status: 'error', 
            message: 'Health check failed' 
        }, { status: 503 })
    }
}
