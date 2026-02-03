// Customer service for API interactions
import { createClient } from '@/utils/supabase/client'

export interface Customer {
    id: string
    customer_name: string
    customer_email?: string | null
    customer_phone: string
    customer_address?: string | null
    customer_vehicle?: any | null // Legacy field - kept for backward compatibility
    created_at?: string
    shop_id: string
    updated_at?: string
    notes?: string | null
    tags?: string[] | null
    license_plate?: string | null // Legacy field - kept for backward compatibility
    customer_source?: string
}

export interface CustomerFormData {
    name: string
    email?: string
    phone?: string
    address?: string
    notes?: string
    tags?: string[]
    source?: string
}

export interface CustomerOption {
    id: string
    name: string
    phone?: string
    email?: string
    address?: string
}

export class CustomerService {
    private static supabase = createClient()

    /**
     * Get all customers for a specific shop
     */
    static async getCustomers(shopId: string): Promise<Customer[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching customers:', error)
            throw new Error(`Failed to fetch customers: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get a single customer by ID
     */
    static async getCustomer(customerId: string): Promise<Customer> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single()

        if (error) {
            console.error('Error fetching customer:', error)
            throw new Error(`Failed to fetch customer: ${error.message}`)
        }

        return data
    }

    /**
     * Create a new customer
     * Automatically populates organization_id for MSO shops
     */
    static async createCustomer(shopId: string, customerData: CustomerFormData): Promise<Customer> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        if (!customerData.name?.trim()) {
            throw new Error('Customer name is required')
        }

        // Fetch shop's organization_id to properly denormalize for MSO access
        const { data: shopData, error: shopError } = await this.supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        if (shopError) {
            console.error('Error fetching shop data:', shopError)
            // Continue without organization_id if shop lookup fails
        }

        const customerPayload = {
            shop_id: shopId,
            organization_id: shopData?.organization_id || null, // Denormalize org ID for efficient MSO queries
            customer_name: customerData.name.trim(),
            customer_email: customerData.email?.trim() || null,
            customer_phone: customerData.phone?.trim() || '',
            customer_address: customerData.address?.trim() || null,
            notes: customerData.notes?.trim() || null,
            tags: customerData.tags || [],
            customer_source: customerData.source || 'manual',
        }

        const { data, error } = await this.supabase
            .from('customers')
            .insert([customerPayload])
            .select()
            .single()

        if (error) {
            console.error('Error creating customer:', error)
            throw new Error(`Failed to create customer: ${error.message}`)
        }

        return data
    }

    /**
     * Update an existing customer
     */
    static async updateCustomer(customerId: string, customerData: Partial<CustomerFormData>): Promise<Customer> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        const updatePayload: any = {
            updated_at: new Date().toISOString()
        }
        
        if (customerData.name !== undefined) {
            if (!customerData.name.trim()) {
                throw new Error('Customer name cannot be empty')
            }
            updatePayload.customer_name = customerData.name.trim()
        }
        if (customerData.email !== undefined) updatePayload.customer_email = customerData.email?.trim() || null
        if (customerData.phone !== undefined) updatePayload.customer_phone = customerData.phone?.trim() || ''
        if (customerData.address !== undefined) updatePayload.customer_address = customerData.address?.trim() || null
        if (customerData.notes !== undefined) updatePayload.notes = customerData.notes?.trim() || null
        if (customerData.tags !== undefined) updatePayload.tags = customerData.tags || []
        if (customerData.source !== undefined) updatePayload.customer_source = customerData.source

        const { data, error } = await this.supabase
            .from('customers')
            .update(updatePayload)
            .eq('id', customerId)
            .select()
            .single()

        if (error) {
            console.error('Error updating customer:', error)
            throw new Error(`Failed to update customer: ${error.message}`)
        }

        return data
    }

    /**
     * Delete a customer
     */
    static async deleteCustomer(customerId: string): Promise<void> {
        if (!customerId) {
            throw new Error('Customer ID is required')
        }

        const { error } = await this.supabase
            .from('customers')
            .delete()
            .eq('id', customerId)

        if (error) {
            console.error('Error deleting customer:', error)
            throw new Error(`Failed to delete customer: ${error.message}`)
        }
    }

    /**
     * Search customers by name, email, or phone
     */
    static async searchCustomers(shopId: string, query: string): Promise<Customer[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        if (!query?.trim()) {
            return this.getCustomers(shopId)
        }

        const searchQuery = query.trim()
        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error searching customers:', error)
            throw new Error(`Failed to search customers: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get customers with their vehicles for dropdown/selection purposes
     */
    static async getCustomersWithVehicles(shopId: string): Promise<(Customer & { vehicles?: any[] })[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await this.supabase
            .from('customers')
            .select(`
                *,
                vehicles:customer_vehicles(*)
            `)
            .eq('shop_id', shopId)
            .order('customer_name', { ascending: true })

        if (error) {
            console.error('Error fetching customers with vehicles:', error)
            throw new Error(`Failed to fetch customers with vehicles: ${error.message}`)
        }

        return data || []
    }

    /**
     * Format customer for display in dropdowns
     */
    static formatCustomerDisplay(customer: Customer): string {
        const name = customer.customer_name
        const phone = customer.customer_phone ? ` (${customer.customer_phone})` : ''
        return `${name}${phone}`
    }

    /**
     * Convert Customer to CustomerOption for dropdowns
     */
    static toCustomerOption(customer: Customer): CustomerOption {
        return {
            id: customer.id,
            name: customer.customer_name,
            phone: customer.customer_phone || undefined,
            email: customer.customer_email || undefined,
            address: customer.customer_address || undefined,
        }
    }

    /**
     * Get customers by phone number (useful for SMS integration)
     */
    static async getCustomerByPhone(shopId: string, phone: string): Promise<Customer | null> {
        if (!shopId || !phone) {
            throw new Error('Shop ID and phone number are required')
        }

        const { data, error } = await this.supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .eq('customer_phone', phone.trim())
            .single()

        if (error) {
            // Not found is acceptable, return null
            if (error.code === 'PGRST116') {
                return null
            }
            console.error('Error fetching customer by phone:', error)
            throw new Error(`Failed to fetch customer: ${error.message}`)
        }

        return data
    }

    /**
     * Add tags to a customer
     */
    static async addCustomerTags(customerId: string, newTags: string[]): Promise<Customer> {
        if (!customerId || !newTags?.length) {
            throw new Error('Customer ID and tags are required')
        }

        // Get current customer to merge tags
        const customer = await this.getCustomer(customerId)
        const currentTags = customer.tags || []
        const uniqueTags = [...new Set([...currentTags, ...newTags])]

        return this.updateCustomer(customerId, { tags: uniqueTags })
    }

    /**
     * Remove tags from a customer
     */
    static async removeCustomerTags(customerId: string, tagsToRemove: string[]): Promise<Customer> {
        if (!customerId || !tagsToRemove?.length) {
            throw new Error('Customer ID and tags are required')
        }

        const customer = await this.getCustomer(customerId)
        const currentTags = customer.tags || []
        const filteredTags = currentTags.filter(tag => !tagsToRemove.includes(tag))

        return this.updateCustomer(customerId, { tags: filteredTags })
    }
}
