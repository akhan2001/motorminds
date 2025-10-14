import { createClient } from '@/utils/supabase/client'

export interface StagingSummary {
    customers: {
        total: number
        pending: number
        matched: number
        invalid: number
        migrated: number
    }
    vehicles: {
        total: number
        pending: number
        matched: number
        invalid: number
        migrated: number
    }
    invoices: {
        total: number
        pending: number
        matched: number
        invalid: number
        migrated: number
    }
}

export interface StagingCustomer {
    id: string
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
    customer_address: string | null
    license_plate: string | null
    customer_source: string | null
    import_status: string | null
    import_batch_id: string | null
    created_at: string | null
    duplicate_of: string | null
}

export interface StagingVehicle {
    id: string
    customer_id: string | null
    year: number | null
    make: string | null
    model: string | null
    vin: string | null
    license_plate: string | null
    engine_type: string | null
    color: string | null
    mileage: number | null
    import_status: string | null
    import_batch_id: string | null
    created_at: string | null
}

export interface StagingInvoice {
    id: string
    invoice_number: string | null
    invoice_date: string | null
    due_date: string | null
    paid_date: string | null
    status: string | null
    payment_method: string | null
    subtotal: number | null
    tax_rate: number | null
    tax_amount: number | null
    discount_amount: number | null
    total_amount: number | null
    labor_total: number | null
    parts_total: number | null
    services_total: number | null
    fees_total: number | null
    invoice_items: any | null
    custom_fields: any | null
    notes: string | null
    import_status: string | null
    import_batch_id: string | null
    created_at: string | null
    customer_id: string | null
    shop_id: string | null
}

export interface StagingFilters {
    search?: string
    status?: string
    batchId?: string
    limit?: number
    offset?: number
}

class MigrationsService {
    private supabase = createClient()

    async getStagingSummary(shopId: string): Promise<StagingSummary> {
        try {
            // Helper function to get counts for each status
            const getStatusCountsFromDB = async (table: string, useJoin: boolean = false) => {
                const counts = { total: 0, pending: 0, matched: 0, invalid: 0, migrated: 0 }
                
                // Get counts for each status
                const statuses = ['pending', 'matched', 'invalid', 'migrated']
                
                for (const status of statuses) {
                    let query
                    if (useJoin) {
                        // For vehicles, join with staging_customers
                        query = this.supabase
                            .from(table)
                            .select('id', { count: 'exact', head: true })
                            .eq('staging_customers.shop_id', shopId)
                            .eq('import_status', status)
                    } else {
                        // For customers and invoices, direct query
                        query = this.supabase
                            .from(table)
                            .select('id', { count: 'exact', head: true })
                            .eq('shop_id', shopId)
                            .eq('import_status', status)
                    }
                    
                    const { count, error } = await query
                    if (error) {
                        console.error(`Error counting ${status} in ${table}:`, error)
                    } else {
                        counts[status as keyof typeof counts] = count || 0
                        counts.total += count || 0
                    }
                }
                
                return counts
            }

            // Get customer counts
            const customers = await getStatusCountsFromDB('staging_customers', false)

            // Get vehicle counts - need special handling due to join
            const vehicleCounts = { total: 0, pending: 0, matched: 0, invalid: 0, migrated: 0 }
            const statuses = ['pending', 'matched', 'invalid', 'migrated']
            
            for (const status of statuses) {
                const { count, error } = await this.supabase
                    .from('staging_customer_vehicles')
                    .select('*, staging_customers!inner(shop_id)', { count: 'exact', head: true })
                    .eq('staging_customers.shop_id', shopId)
                    .eq('import_status', status)
                
                if (error) {
                    console.error(`Error counting ${status} vehicles:`, error)
                } else {
                    vehicleCounts[status as keyof typeof vehicleCounts] = count || 0
                    vehicleCounts.total += count || 0
                }
            }

            // Get invoice counts
            const invoices = await getStatusCountsFromDB('staging_customer_invoices', false)

            return {
                customers,
                vehicles: vehicleCounts,
                invoices
            }
        } catch (error) {
            console.error('Error fetching staging summary:', error)
            throw error
        }
    }

    async getStagingCustomers(shopId: string, filters: StagingFilters = {}): Promise<StagingCustomer[]> {
        try {
            let query = this.supabase
                .from('staging_customers')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })

            if (filters.status) {
                query = query.eq('import_status', filters.status)
            }

            if (filters.batchId) {
                query = query.eq('import_batch_id', filters.batchId)
            }

            if (filters.limit) {
                query = query.limit(filters.limit)
            }

            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
            }

            const { data, error } = await query

            if (error) throw error

            // Apply client-side search filter
            let filteredData = data || []
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                filteredData = filteredData.filter(customer => 
                    customer.customer_name?.toLowerCase().includes(searchTerm) ||
                    customer.customer_email?.toLowerCase().includes(searchTerm) ||
                    customer.customer_phone?.toLowerCase().includes(searchTerm)
                )
            }

            return filteredData
        } catch (error) {
            console.error('Error fetching staging customers:', error)
            throw error
        }
    }

    async getStagingVehicles(shopId: string, filters: StagingFilters = {}): Promise<StagingVehicle[]> {
        try {
            // Vehicles are linked to customers, so we need to join through staging_customers
            let query = this.supabase
                .from('staging_customer_vehicles')
                .select(`
                    *,
                    staging_customers!inner (
                        shop_id
                    )
                `)
                .eq('staging_customers.shop_id', shopId)
                .order('created_at', { ascending: false })

            if (filters.status) {
                query = query.eq('import_status', filters.status)
            }

            if (filters.batchId) {
                query = query.eq('import_batch_id', filters.batchId)
            }

            if (filters.limit) {
                query = query.limit(filters.limit)
            }

            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error in staging vehicles query:', error)
                throw error
            }

            // Apply client-side search filter
            let filteredData = data || []
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                filteredData = filteredData.filter(vehicle => 
                    vehicle.vin?.toLowerCase().includes(searchTerm) ||
                    vehicle.license_plate?.toLowerCase().includes(searchTerm) ||
                    vehicle.make?.toLowerCase().includes(searchTerm) ||
                    vehicle.model?.toLowerCase().includes(searchTerm)
                )
            }

            return filteredData
        } catch (error) {
            console.error('Error fetching staging vehicles:', error)
            throw error
        }
    }

    async getStagingInvoices(shopId: string, filters: StagingFilters = {}): Promise<StagingInvoice[]> {
        try {
            let query = this.supabase
                .from('staging_customer_invoices')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })

            if (filters.status) {
                query = query.eq('import_status', filters.status)
            }

            if (filters.batchId) {
                query = query.eq('import_batch_id', filters.batchId)
            }

            if (filters.limit) {
                query = query.limit(filters.limit)
            }

            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
            }

            const { data, error } = await query

            if (error) throw error

            // Apply client-side search filter
            let filteredData = data || []
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase()
                filteredData = filteredData.filter(invoice => 
                    invoice.invoice_number?.toLowerCase().includes(searchTerm)
                )
            }

            return filteredData
        } catch (error) {
            console.error('Error fetching staging invoices:', error)
            throw error
        }
    }
}

export const migrationsService = new MigrationsService()
