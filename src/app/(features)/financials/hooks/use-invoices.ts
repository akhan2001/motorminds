import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { Invoice, InvoiceWithDetails, InvoiceFormData, InvoiceFilters, InvoiceStats } from '../types/invoice'

const supabase = createClient()

// Fetch all invoices for a shop
export function useInvoices(shopId: string, filters?: InvoiceFilters) {
    return useQuery({
        queryKey: ['invoices', shopId, filters],
        queryFn: async () => {
            let query = supabase
                .from('invoices_table')
                .select(`
                    *,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate),
                    work_order:work_orders(id, work_order_number, title, status)
                `)
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')
                .order('created_at', { ascending: false })

            // Apply filters
            if (filters?.status && filters.status.length > 0) {
                query = query.in('status', filters.status)
            }
            if (filters?.priority && filters.priority.length > 0) {
                query = query.in('priority', filters.priority)
            }
            if (filters?.date_from) {
                query = query.gte('issue_date', filters.date_from)
            }
            if (filters?.date_to) {
                query = query.lte('issue_date', filters.date_to)
            }
            if (filters?.amount_min) {
                query = query.gte('total_amount', filters.amount_min)
            }
            if (filters?.amount_max) {
                query = query.lte('total_amount', filters.amount_max)
            }
            if (filters?.customer_id) {
                query = query.eq('customer_id', filters.customer_id)
            }
            if (filters?.work_order_id) {
                query = query.eq('work_order_id', filters.work_order_id)
            }

            const { data, error } = await query

            if (error) throw error
            return data as InvoiceWithDetails[]
        },
        enabled: !!shopId
    })
}

// Fetch single invoice by ID (using invoice_number as primary key)
export function useInvoice(invoiceId: string) {
    return useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('invoices_table')
                .select(`
                    *,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate),
                    work_order:work_orders(id, work_order_number, title, status)
                `)
                .eq('invoice_number', invoiceId)
                .or('archived.eq.false,archived.is.null')
                .single()

            if (error) {
                console.error('Error fetching invoice:', error)
                throw error
            }
            return data as InvoiceWithDetails
        },
        enabled: !!invoiceId
    })
}

// Fetch invoice stats
export function useInvoiceStats(shopId: string) {
    return useQuery({
        queryKey: ['invoice-stats', shopId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('invoices_table')
                .select('status, total_amount, paid_date')
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')

            if (error) throw error

            const stats: InvoiceStats = {
                total_count: data.length,
                draft_count: data.filter(i => i.status === 'draft').length,
                sent_count: data.filter(i => i.status === 'sent').length,
                paid_count: data.filter(i => i.status === 'paid').length,
                overdue_count: data.filter(i => i.status === 'overdue').length,
                total_amount: data.reduce((sum, i) => sum + Number(i.total_amount), 0),
                paid_amount: data.filter(i => i.paid_date).reduce((sum, i) => sum + Number(i.total_amount), 0),
                outstanding_amount: data.filter(i => !i.paid_date).reduce((sum, i) => sum + Number(i.total_amount), 0)
            }

            return stats
        },
        enabled: !!shopId
    })
}

// Create new invoice
export function useCreateInvoice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: InvoiceFormData & { shop_id: string }) => {
            // Validate walk-in customer data
            if (data.customer_type === 'walk_in') {
                if (!data.walk_in_vehicle_info?.year || !data.walk_in_vehicle_info?.make || 
                    !data.walk_in_vehicle_info?.model) {
                    throw new Error('Year, make, and model are required for walk-in customers')
                }
            } else {
                // For registered customers, customer_id is required
                if (!data.customer_id) {
                    throw new Error('Customer selection is required for registered customers')
                }
            }

            // Generate invoice number
            const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
            
            // Calculate totals - discounts subtract from subtotal
            const subtotal = data.invoice_items.reduce((sum, item) => {
                if (item.item_type === 'discount') {
                    return sum - item.total_price
                }
                return sum + item.total_price
            }, 0)
            const tax_amount = subtotal * data.tax_rate
            const total_amount = subtotal + tax_amount - data.discount_amount

            const invoiceData = {
                ...data,
                invoice_number: invoiceNumber,
                // display_id will be auto-generated by database trigger (INV-001, INV-002, etc.)
                // For walk-in customers, customer_id should be null
                customer_id: data.customer_type === 'walk_in' ? null : data.customer_id,
                subtotal,
                tax_amount,
                total_amount,
                labor_total: data.invoice_items.filter(i => i.item_type === 'labor' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                parts_total: data.invoice_items.filter(i => i.item_type === 'part' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                services_total: data.invoice_items.filter(i => i.item_type === 'service' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                fees_total: data.invoice_items.filter(i => i.item_type === 'fee' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
            }

            const { data: invoice, error } = await supabase
                .from('invoices_table')
                .insert(invoiceData)
                .select()
                .single()

            if (error) {
                console.error('Error creating invoice:', error)
                throw error
            }
            return invoice as Invoice
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
        }
    })
}

// Update invoice
export function useUpdateInvoice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => {
            // Recalculate totals if items changed
            let updates: any = { ...data }
            
            if (data.invoice_items) {
                // Calculate subtotal - discounts subtract, all other items add
                const subtotal = data.invoice_items.reduce((sum, item) => {
                    if (item.item_type === 'discount') {
                        return sum - item.total_price
                    }
                    return sum + item.total_price
                }, 0)
                const tax_rate = data.tax_rate ?? 0  // Use 0 if null/undefined (tax disabled)
                const tax_amount = subtotal * tax_rate
                const discount = data.discount_amount || 0
                const total_amount = subtotal + tax_amount - discount

                updates = {
                    ...updates,
                    subtotal,
                    tax_amount,
                    total_amount,
                    labor_total: data.invoice_items.filter(i => i.item_type === 'labor' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    parts_total: data.invoice_items.filter(i => i.item_type === 'part' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    services_total: data.invoice_items.filter(i => i.item_type === 'service' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    fees_total: data.invoice_items.filter(i => i.item_type === 'fee' && (i as any).active !== false).reduce((sum, i) => sum + i.total_price, 0),
                }
            }

            const { data: invoice, error } = await supabase
                .from('invoices_table')
                .update(updates)
                .eq('invoice_number', id)
                .select()
                .single()

            if (error) throw error
            return invoice as Invoice
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_number] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
        }
    })
}

// Delete invoice
export function useDeleteInvoice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, shop_id }: { id: string; shop_id: string }) => {
            const { error } = await supabase
                .from('invoices_table')
                .delete()
                .eq('invoice_number', id)

            if (error) throw error
            return { id, shop_id }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
        }
    })
}

// Create invoice from work order
export function useCreateInvoiceFromWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ work_order_id, shop_id }: { work_order_id: string; shop_id: string }) => {
            // Fetch work order details
            const { data: workOrder, error: woError } = await supabase
                .from('work_orders')
                .select(`
                    *,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, color, mileage)
                `)
                .eq('id', work_order_id)
                .single()

            if (woError) {
                console.error('Error fetching work order:', woError)
                throw woError
            }

            // Check if work order already has an invoice by querying invoices_table
            const { data: existingInvoice } = await supabase
                .from('invoices_table')
                .select('id')
                .eq('work_order_id', work_order_id)
                .limit(1)
                .single()

            if (existingInvoice) {
                throw new Error('This work order has already been converted to an invoice. Each work order can only be converted once.')
            }

            // Fetch ALL work order items (both active and declined)
            const { data: items, error: itemsError } = await supabase
                .from('work_order_items')
                .select('*')
                .eq('work_order_id', work_order_id)

            if (itemsError) {
                console.error('Error fetching work order items:', itemsError)
                throw itemsError
            }

            if (!items || items.length === 0) {
                throw new Error('No items found for this work order. Please add items before generating an invoice.')
            }

            // Transform work order items to invoice items
            const invoiceItems = items.map(item => {
                const isDeclined = item.active === false
                
                // Calculate total_price consistently with work order service logic
                let calculatedTotalPrice = 0
                if (item.item_type === 'labor') {
                    // For labor: labor_hours * unit_price
                    calculatedTotalPrice = (item.labor_hours || 0) * (item.unit_price || 0)
                } else {
                    // For parts, services, fees: quantity * unit_price
                    calculatedTotalPrice = (item.quantity || 0) * (item.unit_price || 0)
                }
                
                return {
                    id: item.id,
                    item_type: item.item_type,
                    description: isDeclined ? `${item.description}` : item.description,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    total_price: calculatedTotalPrice,
                    unit_cost: item.unit_cost ? Number(item.unit_cost) : undefined,
                    total_cost: item.total_cost ? Number(item.total_cost) : undefined,
                    part_number: item.part_number,
                    supplier: item.supplier,
                    category: item.category,
                    warranty_period: item.warranty_period,
                    labor_hours: item.labor_hours ? Number(item.labor_hours) : undefined,
                    technician_id: item.technician_id || undefined,
                    active: item.active, // Preserve the active field from work order
                    is_declined: isDeclined
                }
            })

            // Create invoice - only include approved items in subtotal, handle discounts correctly
            const subtotal = invoiceItems
                .filter(item => item.active !== false)
                .reduce((sum, item) => {
                    // Discounts subtract from subtotal, all other items add
                    if (item.item_type === 'discount') {
                        return sum - item.total_price
                    }
                    return sum + item.total_price
                }, 0)
            const tax_rate = 0.13
            const tax_amount = subtotal * tax_rate
            const total_amount = subtotal + tax_amount

            // Generate invoice number
            const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

            // Creating invoice with data
                shop_id,
                work_order_id,
                customer_id: workOrder.customer_id,
                vehicle_id: workOrder.vehicle_id,
                subtotal,
                tax_amount,
                total_amount
            })

            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices_table')
                .insert({
                    invoice_number: invoiceNumber,
                    // display_id will be auto-generated by database trigger (INV-001, INV-002, etc.)
                    shop_id,
                    work_order_id,
                    customer_id: workOrder.customer_id, // null for walk-in customers
                    vehicle_id: workOrder.vehicle_id,
                    title: workOrder.title || 'Service Invoice',
                    description: workOrder.description,
                    status: 'draft',
                    priority: workOrder.priority || 'medium',
                    subtotal,
                    tax_rate,
                    tax_amount,
                    total_amount,
                    discount_amount: 0,
                    labor_total: invoiceItems.filter(i => i.item_type === 'labor' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    parts_total: invoiceItems.filter(i => i.item_type === 'part' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    services_total: invoiceItems.filter(i => i.item_type === 'service' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    fees_total: invoiceItems.filter(i => i.item_type === 'fee' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0),
                    invoice_items: invoiceItems,
                    issue_date: new Date().toISOString(),
                    // Preserve walk-in customer information from work order
                    customer_type: workOrder.customer_type || 'registered',
                    walk_in_vehicle_info: workOrder.walk_in_vehicle_info,
                })
                .select()
                .single()

            if (invoiceError) {
                console.error('Error creating invoice:', invoiceError)
                throw invoiceError
            }

            // No need to update work order - relationship is maintained via invoices_table.work_order_id
            return invoice as Invoice
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['work-orders'] })
        }
    })
}
