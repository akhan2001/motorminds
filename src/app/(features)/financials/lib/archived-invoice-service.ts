import { createClient } from '@/utils/supabase/client'
import { Invoice, InvoiceWithDetails } from '../types/invoice'

const supabase = createClient()

export interface ArchivedInvoiceFilters {
    status?: Invoice['status'][]
    priority?: Invoice['priority'][]
    payment_method?: Invoice['payment_method'][]
    date_from?: string
    date_to?: string
    amount_min?: number
    amount_max?: number
    customer_id?: string
    work_order_id?: string
    search?: string
}

export interface ArchivedInvoiceListParams {
    shopId: string
    page?: number
    limit?: number
    filters?: ArchivedInvoiceFilters
}

export class ArchivedInvoiceService {
    static async getArchivedInvoices(params: ArchivedInvoiceListParams): Promise<InvoiceWithDetails[]> {
        const { shopId, page = 1, limit = 50, filters = {} } = params
        
        let query = supabase
            .from('invoices_table')
            .select(`
                *,
                customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                vehicle:customer_vehicles(id, year, make, model, license_plate, vin, engine_type, mileage, color),
                work_order:work_orders(id, work_order_number, title, status)
            `)
            .eq('shop_id', shopId)
            .eq('archived', true)
            .order('created_at', { ascending: false })

        // Apply filters
        if (filters.status && filters.status.length > 0) {
            query = query.in('status', filters.status)
        }

        if (filters.priority && filters.priority.length > 0) {
            query = query.in('priority', filters.priority)
        }

        if (filters.payment_method && filters.payment_method.length > 0) {
            query = query.in('payment_method', filters.payment_method)
        }

        if (filters.date_from) {
            query = query.gte('issue_date', filters.date_from)
        }

        if (filters.date_to) {
            query = query.lte('issue_date', filters.date_to)
        }

        if (filters.amount_min !== undefined) {
            query = query.gte('total_amount', filters.amount_min)
        }

        if (filters.amount_max !== undefined) {
            query = query.lte('total_amount', filters.amount_max)
        }

        if (filters.customer_id) {
            query = query.eq('customer_id', filters.customer_id)
        }

        if (filters.work_order_id) {
            query = query.eq('work_order_id', filters.work_order_id)
        }

        // Apply search filter - search across invoice_number, title, and display_id
        if (filters.search && filters.search.trim()) {
            const searchTerm = `%${filters.search.trim()}%`
            // Use or() to search across multiple fields
            query = query.or(`invoice_number.ilike.${searchTerm},title.ilike.${searchTerm},display_id.ilike.${searchTerm}`)
        }

        // Apply pagination
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching archived invoices:', error)
            throw new Error(`Failed to fetch archived invoices: ${error.message}`)
        }

        return this.transformInvoices(data || [])
    }

    static async getArchivedInvoice(invoiceId: string): Promise<InvoiceWithDetails | null> {
        try {
            const { data, error } = await supabase
                .from('invoices_table')
                .select(`
                    *,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, engine_type, mileage, color),
                    work_order:work_orders(id, work_order_number, title, status)
                `)
                .eq('invoice_number', invoiceId)
                .eq('archived', true)
                .single()

            if (error) {
                console.error('Error fetching archived invoice:', error)
                return null
            }

            return this.transformInvoice(data)
        } catch (error) {
            console.error('Failed to fetch archived invoice:', error)
            return null
        }
    }

    static async getArchivedInvoiceCount(shopId: string, filters?: ArchivedInvoiceFilters): Promise<number> {
        try {
            let query = supabase
                .from('invoices_table')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .eq('archived', true)

            // Apply filters
            if (filters?.status && filters.status.length > 0) {
                query = query.in('status', filters.status)
            }

            // Apply search filter
            if (filters?.search && filters.search.trim()) {
                const searchTerm = `%${filters.search.trim()}%`
                query = query.or(`invoice_number.ilike.${searchTerm},title.ilike.${searchTerm},display_id.ilike.${searchTerm}`)
            }

            const { count, error } = await query

        if (error) {
            console.error('Error getting archived invoice count:', error)
            console.error('Query details:', { shopId, filters })
            return 0
        }

        return count || 0
        } catch (err) {
            console.error('Exception in getArchivedInvoiceCount:', err)
            return 0 // Return 0 instead of throwing to prevent UI breaks
        }
    }

    private static transformInvoice(data: any): InvoiceWithDetails {
        return {
            id: data.id,
            invoice_number: data.invoice_number,
            display_id: data.display_id,
            work_order_id: data.work_order_id,
            customer_id: data.customer_id,
            vehicle_id: data.vehicle_id,
            shop_id: data.shop_id,
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            subtotal: Number(data.subtotal),
            tax_rate: Number(data.tax_rate || 0),
            tax_amount: Number(data.tax_amount || 0),
            discount_amount: Number(data.discount_amount || 0),
            total_amount: Number(data.total_amount),
            labor_total: Number(data.labor_total || 0),
            parts_total: Number(data.parts_total || 0),
            services_total: Number(data.services_total || 0),
            fees_total: Number(data.fees_total || 0),
            invoice_items: data.invoice_items || [],
            issue_date: data.issue_date,
            due_date: data.due_date,
            paid_date: data.paid_date,
            payment_method: data.payment_method,
            payment_reference: data.payment_reference,
            notes: data.notes,
            created_at: data.created_at,
            updated_at: data.updated_at,
            customer: data.customer ? {
                id: data.customer.id,
                customer_name: data.customer.customer_name,
                customer_email: data.customer.customer_email,
                customer_phone: data.customer.customer_phone,
                customer_address: data.customer.customer_address
            } : undefined as any,
            vehicle: data.vehicle ? {
                id: data.vehicle.id,
                year: data.vehicle.year,
                make: data.vehicle.make,
                model: data.vehicle.model,
                license_plate: data.vehicle.license_plate
            } : null,
            work_order: data.work_order ? {
                id: data.work_order.id,
                work_order_number: data.work_order.work_order_number,
                title: data.work_order.title,
                status: data.work_order.status
            } : null
        }
    }

    private static transformInvoices(data: any[]): InvoiceWithDetails[] {
        return data.map(item => this.transformInvoice(item))
    }
}

