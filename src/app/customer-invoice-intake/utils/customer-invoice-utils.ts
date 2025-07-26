import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface CustomerInvoiceData {
  shopId: string
  customerId: string
  vehicleId: string
  serviceDescription: string
  estimatedAmount: number
}

export interface CustomerInvoice {
  invoice_number: string
  shop_id: string
  customer_id: string
  vehicle_id: string
  status: 'UNPAID' | 'PAID'
  amount: number
  issue_date: string
  client_name: string
  client_email?: string
  client_phone?: string
  description: string
  source: 'customer_generated' | 'shop_generated'
  estimated_amount?: number
  vehicle_information?: {
    year: string
    make: string
    model: string
    license_plate: string
  }
}

/**
 * Creates a customer-generated invoice
 */
export async function createCustomerInvoice(data: CustomerInvoiceData): Promise<string> {
  try {
    // Fetch shop information
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('shop_name, shop_address, shop_email, shop_phone')
      .eq('id', data.shopId)
      .single()

    if (shopError) throw new Error(`Failed to fetch shop data: ${shopError.message}`)
    if (!shopData) throw new Error('Shop not found')

    // Fetch customer information
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('customer_name, customer_email, customer_phone, customer_address')
      .eq('id', data.customerId)
      .single()

    if (customerError) throw new Error(`Failed to fetch customer data: ${customerError.message}`)
    if (!customerData) throw new Error('Customer not found')

    // Fetch vehicle information
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('customer_vehicles')
      .select('year, make, model, license_plate, vin')
      .eq('id', data.vehicleId)
      .single()

    if (vehicleError) throw new Error(`Failed to fetch vehicle data: ${vehicleError.message}`)
    if (!vehicleData) throw new Error('Vehicle not found')

    // Generate invoice number
    const invoiceNumber = uuidv4()
    const displayId = await generateDisplayId(data.shopId)

    // Create the invoice record
    const invoiceRecord = {
      invoice_number: invoiceNumber,
      display_id: displayId,
      shop_id: data.shopId,
      customer_id: data.customerId,
      vehicle_id: data.vehicleId,
              status: 'UNPAID' as const,
        amount: 0, // Invoice starts at $0, shop will fill in actual pricing
        estimated_amount: data.estimatedAmount, // Customer's budget expectation
      issue_date: new Date().toISOString(),
      
      // Shop information
      shop_name: shopData.shop_name,
      shop_address: shopData.shop_address,
      shop_email: shopData.shop_email,
      shop_phone: shopData.shop_phone,
      
      // Customer information
      client_name: customerData.customer_name,
      client_email: customerData.customer_email,
      client_phone: customerData.customer_phone,
      client_address: customerData.customer_address,
      
              // Service information
        description: null, // Will be filled by shop when adding actual service work
        customer_notes: data.serviceDescription, // Customer's original request
        notes: 'Customer-generated service request. Pending shop review and pricing.',
      
      // Source tracking
      source: 'customer_generated' as const,
      
      // Vehicle information as JSONB
      vehicle_information: {
        year: vehicleData.year?.toString() || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        license_plate: vehicleData.license_plate || '',
        vin: vehicleData.vin || ''
      },
      
      // Initialize empty labor and parts for shop to fill later
      labour: null,
      labour_total_price: null,
      parts: null,
      parts_total_price: null,
      labour_items: [],
      parts_items: [],
      
      // Additional fields
      mileage: null,
      assigned_to: null,
      workorder_id: null
    }

    // Insert the invoice
    const { data: insertedInvoice, error: insertError } = await supabase
      .from('invoices')
      .insert(invoiceRecord)
      .select('invoice_number')
      .single()

    if (insertError) {
      console.error('Invoice insert error:', insertError)
      throw new Error(`Failed to create invoice: ${insertError.message}`)
    }

    if (!insertedInvoice) {
      throw new Error('Failed to create invoice - no data returned')
    }

    console.log(`Customer invoice created successfully: ${insertedInvoice.invoice_number}`)
    return insertedInvoice.invoice_number

  } catch (error) {
    console.error('Error creating customer invoice:', error)
    throw error
  }
}

/**
 * Generates a human-readable display ID for invoices
 */
async function generateDisplayId(shopId: string): Promise<string> {
  try {
    // Get the count of existing invoices for this shop to generate sequential ID
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)

    if (error) {
      console.warn('Could not get invoice count, using timestamp:', error)
      return `INV-${Date.now()}`
    }

    const nextNumber = (count || 0) + 1
    return `INV-${nextNumber.toString().padStart(4, '0')}`
  } catch (error) {
    console.warn('Error generating display ID, using fallback:', error)
    return `INV-${Date.now()}`
  }
}

/**
 * Fetches customer-generated invoices for a shop
 */
export async function fetchCustomerGeneratedInvoices(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shopId)
      .eq('source', 'customer_generated')
      .order('issue_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching customer-generated invoices:', error)
    throw error
  }
}

/**
 * Updates an invoice amount and status (for shop owners)
 */
export async function updateInvoiceShopDetails(
  invoiceNumber: string,
  shopId: string,
  updates: {
    amount?: number
    labour?: string
    labour_total_price?: number
    parts?: string
    parts_total_price?: number
    labour_items?: any[]
    parts_items?: any[]
    notes?: string
    assigned_to?: string
    mileage?: string
    status?: 'PAID' | 'UNPAID'
  }
) {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('invoice_number', invoiceNumber)
      .eq('shop_id', shopId)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating invoice shop details:', error)
    throw error
  }
} 