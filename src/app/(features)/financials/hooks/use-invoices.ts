import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { Invoice, InvoiceWithDetails, InvoiceFormData, InvoiceFilters, InvoiceStats, InvoiceItem } from '../types/invoice'

const supabase = createClient()

// Fetch all invoices for a shop
export function useInvoices(shopId: string, filters?: InvoiceFilters, limit: number = 100, offset: number = 0) {
    return useQuery({
        queryKey: ['invoices', shopId, filters, limit, offset],
        queryFn: async () => {
            let query = supabase
                .from('invoices_table')
                .select(`
                    id, invoice_number, shop_id, customer_id, vehicle_id, work_order_id, title, description, status, priority, total_amount, subtotal, tax_amount, discount_amount, issue_date, due_date, paid_date, created_at, updated_at, archived, notes, payments, amount_paid, outstanding_balance,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, engine_type, mileage, color),
                    work_order:work_orders(id, work_order_number, title, status)
                `)
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

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
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, engine_type, mileage, color),
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

// Fetch invoice stats (optimized with aggregation)
export function useInvoiceStats(shopId: string) {
    return useQuery({
        queryKey: ['invoice-stats', shopId],
        queryFn: async () => {
            // Fetch only necessary fields for stats calculation
            const { data, error } = await supabase
                .from('invoices_table')
                .select('status, total_amount, paid_date')
                .eq('shop_id', shopId)
                .or('archived.eq.false,archived.is.null')

            if (error) throw error

            // Calculate stats in memory (more efficient than multiple queries)
            const stats: InvoiceStats = {
                total_count: data.length,
                draft_count: data.filter(i => i.status === 'draft').length,
                sent_count: data.filter(i => i.status === 'sent').length,
                paid_count: data.filter(i => i.status === 'paid').length,
                overdue_count: data.filter(i => i.status === 'overdue').length,
                total_amount: data.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
                paid_amount: data.filter(i => i.paid_date).reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
                outstanding_amount: data.filter(i => !i.paid_date).reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
            }

            return stats
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
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
                    !data.walk_in_vehicle_info?.model || !data.walk_in_vehicle_info?.license_plate) {
                    throw new Error('Year, make, model, and license plate are required for walk-in customers')
                }
            } else {
                // For registered customers, customer_id is required
                if (!data.customer_id) {
                    throw new Error('Customer selection is required for registered customers')
                }
            }

            // Generate invoice number
            const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
            
            // Calculate totals - discounts subtract from subtotal, exclude expense items (tracking only)
            const subtotal = data.invoice_items
                .filter(item => (item as any).active !== false && item.item_type !== 'expense')
                .reduce((sum, item) => {
                    // Discounts subtract from subtotal (always use positive value), all other items add
                    if (item.item_type === 'discount') {
                        return sum - Math.abs(item.total_price || 0)
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
                // Calculate subtotal - discounts subtract, all other items add, exclude expense items (tracking only)
                const subtotal = data.invoice_items
                    .filter(item => (item as any).active !== false && item.item_type !== 'expense')
                    .reduce((sum, item) => {
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
            
            // Sync invoice items back to work order items if this invoice is linked to a work order
            if (invoice.work_order_id && data.invoice_items) {
                try {
                    await syncInvoiceItemsToWorkOrder(invoice.work_order_id, data.invoice_items, invoice.shop_id)
                } catch (syncError) {
                    console.error('Error syncing invoice items to work order:', syncError)
                    // Don't fail the invoice update if sync fails
                }
            }
            
            return invoice as Invoice
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_number] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
            // Also invalidate work order items to reflect changes
            if (data.work_order_id) {
                queryClient.invalidateQueries({ queryKey: ['work-order-items', data.work_order_id] })
                queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            }
        }
    })
}

// Helper function to sync invoice items back to work order items
async function syncInvoiceItemsToWorkOrder(
    workOrderId: string,
    invoiceItems: InvoiceItem[],
    shopId: string
): Promise<void> {
    // Get existing work order items
    const { data: existingItems, error: fetchError } = await supabase
        .from('work_order_items')
        .select('id')
        .eq('work_order_id', workOrderId)

    if (fetchError) {
        console.error('Error fetching existing work order items:', fetchError)
        throw fetchError
    }

    const existingItemIds = new Set((existingItems || []).map(item => item.id))
    const invoiceItemIds = new Set(invoiceItems.map(item => item.id))

    // Items to update (exist in both)
    const itemsToUpdate = invoiceItems.filter(item => existingItemIds.has(item.id))
    
    // Items to insert (new items in invoice)
    const itemsToInsert = invoiceItems.filter(item => !existingItemIds.has(item.id))
    
    // Items to delete (removed from invoice)
    const itemIdsToDelete = [...existingItemIds].filter(id => !invoiceItemIds.has(id))

    // Update existing items
    for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
            .from('work_order_items')
            .update({
                item_type: item.item_type,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                part_number: item.part_number || null,
                supplier: item.supplier || null,
                category: item.category || null,
                warranty_period: item.warranty_period || null,
                labor_hours: item.labor_hours || null,
                technician_id: item.technician_id || null,
            })
            .eq('id', item.id)

        if (updateError) {
            console.error('Error updating work order item:', updateError)
        }
    }

    // Insert new items
    if (itemsToInsert.length > 0) {
        const newItems = itemsToInsert.map(item => ({
            work_order_id: workOrderId,
            shop_id: shopId,
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            part_number: item.part_number || null,
            supplier: item.supplier || null,
            category: item.category || null,
            warranty_period: item.warranty_period || null,
            labor_hours: item.labor_hours || null,
            technician_id: item.technician_id || null,
        }))

        const { error: insertError } = await supabase
            .from('work_order_items')
            .insert(newItems)

        if (insertError) {
            console.error('Error inserting work order items:', insertError)
        }
    }

    // Delete removed items
    if (itemIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
            .from('work_order_items')
            .delete()
            .in('id', itemIdsToDelete)

        if (deleteError) {
            console.error('Error deleting work order items:', deleteError)
        }
    }
}

// Delete invoice
export function useDeleteInvoice() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, shop_id }: { id: string; shop_id: string }) => {
            // First, fetch the invoice to get work_order_id before deleting
            const { data: invoice, error: fetchError } = await supabase
                .from('invoices_table')
                .select('work_order_id')
                .eq('invoice_number', id)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError
            }

            // If linked to a work order, clear the work order's invoice_id reference
            if (invoice?.work_order_id) {
                const { error: workOrderUpdateError } = await supabase
                    .from('work_orders')
                    .update({ invoice_id: null })
                    .eq('id', invoice.work_order_id)

                if (workOrderUpdateError) {
                    console.error('Error clearing work order invoice reference:', workOrderUpdateError)
                    // Don't throw - continue with invoice deletion
                }
            }

            // Delete the invoice
            const { error } = await supabase
                .from('invoices_table')
                .delete()
                .eq('invoice_number', id)

            if (error) throw error
            return { id, shop_id, work_order_id: invoice?.work_order_id }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
            // Invalidate work order queries to reflect invoice removal
            if (data.work_order_id) {
                queryClient.invalidateQueries({ queryKey: ['work-order-invoice', data.work_order_id] })
                queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            }
            // Invalidate financials queries
            queryClient.invalidateQueries({ queryKey: ['financial-stats'] })
            queryClient.invalidateQueries({ queryKey: ['financials'] })
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
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, engine_type, mileage, color)
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

            // Allow empty invoices - they can be synced later when items are added
            // Transform work order items to invoice items (empty array is valid)
            // Filter to only billable items - is_billable determines if item appears on customer invoices
            // Expenses default to is_billable=false (internal costs), other types default to true
            const invoiceItems = (items || [])
                .filter(item => item.is_billable !== false) // Include items where is_billable is true or undefined (for backwards compat)
                .map(item => {
                const isDeclined = item.active === false
                
                // Validate and ensure unit_price is set correctly
                let unitPrice = Number(item.unit_price) || 0
                let quantity = Number(item.quantity) || 0
                let laborHours = item.labor_hours ? Number(item.labor_hours) : undefined
                
                // Calculate total_price consistently with work order service logic
                let calculatedTotalPrice = 0
                if (item.item_type === 'labor') {
                    // For labor: labor_hours * unit_price
                    calculatedTotalPrice = (laborHours || 0) * unitPrice
                    
                    // If total_price exists but unit_price is 0, reverse-calculate unit_price
                    if (unitPrice === 0 && item.total_price && laborHours && laborHours > 0) {
                        unitPrice = item.total_price / laborHours
                        calculatedTotalPrice = item.total_price
                    }
                } else {
                    // For parts, services, fees, discounts: quantity * unit_price
                    // For discounts, ensure unit_price is positive (stored as positive, subtracted in calculations)
                    if (item.item_type === 'discount') {
                        unitPrice = Math.abs(unitPrice)
                    }
                    calculatedTotalPrice = quantity * unitPrice
                    
                    // If total_price exists but unit_price is 0, reverse-calculate unit_price
                    if (unitPrice === 0 && item.total_price && quantity && quantity > 0) {
                        unitPrice = Math.abs(item.total_price / quantity)
                        calculatedTotalPrice = Math.abs(item.total_price)
                    }
                }
                
                // If we still don't have a calculated total, use the stored total_price
                if (calculatedTotalPrice === 0 && item.total_price) {
                    calculatedTotalPrice = Number(item.total_price)
                }
                
                return {
                    id: item.id,
                    item_type: item.item_type,
                    description: isDeclined ? `${item.description}` : item.description,
                    quantity: quantity,
                    unit_price: unitPrice,  // Now guaranteed to have correct value
                    total_price: calculatedTotalPrice,
                    unit_cost: item.unit_cost ? Number(item.unit_cost) : undefined,
                    total_cost: item.total_cost ? Number(item.total_cost) : undefined,
                    part_number: item.part_number,
                    supplier: item.supplier,
                    category: item.category,
                    warranty_period: item.warranty_period,
                    labor_hours: laborHours,
                    technician_id: item.technician_id || undefined,
                    active: item.active, // Preserve the active field from work order
                    is_declined: isDeclined,
                    invoice_specific_notes: item.notes || undefined // Copy work order item notes to invoice-specific notes
                }
            })

            // Create invoice - only include approved items in subtotal, handle discounts correctly
            // Exclude expense items (tracking only) and rejected items
            const subtotal = invoiceItems
                .filter(item => item.active !== false && item.item_type !== 'expense')
                .reduce((sum, item) => {
                    // Discounts subtract from subtotal (always use positive value), all other items add
                    if (item.item_type === 'discount') {
                        return sum - Math.abs(item.total_price || 0)
                    }
                    return sum + item.total_price
                }, 0)
            const tax_rate = 0.13
            const tax_amount = subtotal * tax_rate
            const total_amount = subtotal + tax_amount

            // Generate invoice number
            const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

            // Creating invoice with data
            const invoiceData = {
                shop_id,
                work_order_id,
                customer_id: workOrder.customer_id,
                vehicle_id: workOrder.vehicle_id,
                subtotal,
                tax_amount,
                total_amount
            }

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
                    notes: workOrder.notes || null, // Copy work order recommendations/notes to invoice
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
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            // Invalidate work order invoice query to update the modal without refresh
            queryClient.invalidateQueries({ queryKey: ['work-order-invoice', variables.work_order_id] })
        }
    })
}

// Sync existing invoice with current work order items
export function useSyncInvoiceFromWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ work_order_id, shop_id }: { work_order_id: string; shop_id: string }) => {
            // Fetch existing invoice for this work order
            const { data: existingInvoice, error: invoiceFetchError } = await supabase
                .from('invoices_table')
                .select('*')
                .eq('work_order_id', work_order_id)
                .limit(1)
                .single()

            if (invoiceFetchError) {
                console.error('Error fetching existing invoice:', invoiceFetchError)
                throw new Error('No invoice found for this work order')
            }

            // Fetch current work order items
            const { data: items, error: itemsError } = await supabase
                .from('work_order_items')
                .select('*')
                .eq('work_order_id', work_order_id)

            if (itemsError) {
                console.error('Error fetching work order items:', itemsError)
                throw itemsError
            }

            // Transform work order items to invoice items (allow empty arrays)
            // Filter to only billable items - is_billable determines if item appears on customer invoices
            // Expenses default to is_billable=false (internal costs), other types default to true
            const invoiceItems = (items || [])
                .filter(item => item.is_billable !== false) // Include items where is_billable is true or undefined (for backwards compat)
                .map(item => {
                const isDeclined = item.active === false
                
                let unitPrice = Number(item.unit_price) || 0
                let quantity = Number(item.quantity) || 0
                let laborHours = item.labor_hours ? Number(item.labor_hours) : undefined
                
                let calculatedTotalPrice = 0
                if (item.item_type === 'labor') {
                    calculatedTotalPrice = (laborHours || 0) * unitPrice
                    if (unitPrice === 0 && item.total_price && laborHours && laborHours > 0) {
                        unitPrice = item.total_price / laborHours
                        calculatedTotalPrice = item.total_price
                    }
                } else {
                    calculatedTotalPrice = quantity * unitPrice
                    if (unitPrice === 0 && item.total_price && quantity && quantity > 0) {
                        unitPrice = item.total_price / quantity
                        calculatedTotalPrice = item.total_price
                    }
                }
                
                if (calculatedTotalPrice === 0 && item.total_price) {
                    calculatedTotalPrice = Number(item.total_price)
                }
                
                return {
                    id: item.id,
                    item_type: item.item_type,
                    description: isDeclined ? `${item.description}` : item.description,
                    quantity: quantity,
                    unit_price: unitPrice,
                    total_price: calculatedTotalPrice,
                    unit_cost: item.unit_cost ? Number(item.unit_cost) : undefined,
                    total_cost: item.total_cost ? Number(item.total_cost) : undefined,
                    part_number: item.part_number,
                    supplier: item.supplier,
                    category: item.category,
                    warranty_period: item.warranty_period,
                    labor_hours: laborHours,
                    technician_id: item.technician_id || undefined,
                    active: item.active,
                    is_declined: isDeclined,
                    invoice_specific_notes: item.notes || undefined // Copy work order item notes to invoice-specific notes
                }
            })

            // Recalculate totals - only include approved items, exclude expense items (tracking only)
            const subtotal = invoiceItems
                .filter(item => item.active !== false && item.item_type !== 'expense')
                .reduce((sum, item) => {
                    if (item.item_type === 'discount') {
                        return sum - item.total_price
                    }
                    return sum + item.total_price
                }, 0)
            
            const tax_rate = existingInvoice.tax_rate ?? 0.13
            const tax_amount = subtotal * tax_rate
            const discount_amount = existingInvoice.discount_amount || 0
            const total_amount = subtotal + tax_amount - discount_amount

            // Calculate category totals - exclude expense items (tracking only)
            const labor_total = invoiceItems.filter(i => i.item_type === 'labor' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0)
            const parts_total = invoiceItems.filter(i => i.item_type === 'part' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0)
            const services_total = invoiceItems.filter(i => i.item_type === 'service' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0)
            const fees_total = invoiceItems.filter(i => i.item_type === 'fee' && i.active !== false).reduce((sum, i) => sum + i.total_price, 0)

            // Calculate new outstanding balance based on existing payments
            const amount_paid = Number(existingInvoice.amount_paid) || 0
            const outstanding_balance = Math.max(0, total_amount - amount_paid)

            // Fetch work order to get updated notes/recommendations
            const { data: workOrder, error: workOrderError } = await supabase
                .from('work_orders')
                .select('notes, description, title')
                .eq('id', work_order_id)
                .single()

            // Update invoice - preserve status, payments, and other metadata
            const { data: updatedInvoice, error: updateError } = await supabase
                .from('invoices_table')
                .update({
                    invoice_items: invoiceItems,
                    subtotal,
                    tax_amount,
                    total_amount,
                    labor_total,
                    parts_total,
                    services_total,
                    fees_total,
                    outstanding_balance,
                    notes: workOrder?.notes || existingInvoice.notes, // Update notes from work order if available
                    description: workOrder?.description || existingInvoice.description, // Update description from work order if available
                    title: workOrder?.title || existingInvoice.title, // Update title from work order if available
                    updated_at: new Date().toISOString()
                    // Note: status is preserved (not updated)
                })
                .eq('invoice_number', existingInvoice.invoice_number)
                .select()
                .single()

            if (updateError) {
                console.error('Error updating invoice:', updateError)
                throw updateError
            }

            return updatedInvoice as Invoice
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['invoice', data.invoice_number] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats', data.shop_id] })
            queryClient.invalidateQueries({ queryKey: ['work-order-invoice', variables.work_order_id] })
        }
    })
}

// Check if a work order has an existing invoice and get payment info
export async function getWorkOrderInvoiceStatus(workOrderId: string): Promise<{
    hasInvoice: boolean;
    invoice?: {
        invoice_number: string;
        amount_paid: number;
        total_amount: number;
        status: string;
    };
}> {
    const { data: invoice } = await supabase
        .from('invoices_table')
        .select('invoice_number, amount_paid, total_amount, status')
        .eq('work_order_id', workOrderId)
        .limit(1)
        .single()

    if (!invoice) {
        return { hasInvoice: false }
    }

    return {
        hasInvoice: true,
        invoice: {
            invoice_number: invoice.invoice_number,
            amount_paid: Number(invoice.amount_paid) || 0,
            total_amount: Number(invoice.total_amount) || 0,
            status: invoice.status
        }
    }
}
