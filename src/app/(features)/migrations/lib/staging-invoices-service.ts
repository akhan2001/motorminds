import { createClient } from '@/utils/supabase/client'
import { StagingInvoice, StagingCustomer } from '../types/staging-invoices'

export class StagingInvoicesService {
    private supabase = createClient()

    // Get staging customers for search
    async getStagingCustomers(shopId?: string): Promise<StagingCustomer[]> {
        try {
            let query = this.supabase
                .from('staging_customers')
                .select('*')

            if (shopId) {
                query = query.eq('shop_id', shopId)
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching staging customers:', error)
                throw new Error(`Failed to fetch staging customers: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error in getStagingCustomers:', error)
            throw error
        }
    }

    // Get staging invoices for a specific customer
    async getStagingInvoicesByCustomer(customerId: string): Promise<StagingInvoice[]> {
        try {
            const { data, error } = await this.supabase
                .from('staging_customer_invoices')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching staging invoices by customer:', error)
                throw new Error(`Failed to fetch staging invoices: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error in getStagingInvoicesByCustomer:', error)
            throw error
        }
    }

    // Search staging customers by name, email, or phone
    async searchStagingCustomers(searchQuery: string, shopId?: string): Promise<StagingCustomer[]> {
        try {
            let query = this.supabase
                .from('staging_customers')
                .select('*')
                .or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`)

            if (shopId) {
                query = query.eq('shop_id', shopId)
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) {
                console.error('Error searching staging customers:', error)
                throw new Error(`Failed to search staging customers: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error in searchStagingCustomers:', error)
            throw error
        }
    }
}

export const stagingInvoicesService = new StagingInvoicesService()
