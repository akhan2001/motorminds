import { supabase } from "@/lib/supabase";
import type { SegmentCriteria } from "../types/segment";

// Re-export types for backward compatibility
export type { SegmentCriteria } from "../types/segment";

// `buildSegmentQuery(shopId, criteria)` - Convert filter criteria to Supabase query
// Returns customer IDs matching all criteria
export async function buildSegmentQuery(
    shopId: string,
    criteria: SegmentCriteria
): Promise<string[]> {
    // Start with base query
    let customerIds: string[] = []

    // Step 1: Get base customers filtered by shop_id and tags
    let baseQuery = supabase
        .from('customers')
        .select('id, customer_phone, tags')
        .eq('shop_id', shopId)

    // Apply tags filter
    if (criteria.tags?.contains && criteria.tags.contains.length > 0) {
        criteria.tags.contains.forEach(tag => {
            baseQuery = baseQuery.contains('tags', [tag])
        })
    }

    const { data: baseCustomers, error: baseError } = await baseQuery

    if (baseError) throw baseError
    if (!baseCustomers || baseCustomers.length === 0) {
        return []
    }

    // Filter out customers with excluded tags (in memory)
    let filteredCustomers = baseCustomers
    if (criteria.tags?.notContains && criteria.tags.notContains.length > 0) {
        filteredCustomers = baseCustomers.filter(customer => {
            if (!customer.tags || !Array.isArray(customer.tags)) return true
            return !criteria.tags!.notContains!.some(excludedTag => 
                customer.tags.includes(excludedTag)
            )
        })
    }

    customerIds = filteredCustomers.map(c => c.id)

    // Step 2: Apply vehicle filters (if specified)
    if (criteria.vehicle) {
        const vehicleQuery = supabase
            .from('customer_vehicles')
            .select('customer_id')
            .in('customer_id', customerIds)

        if (criteria.vehicle.make && criteria.vehicle.make.length > 0) {
            vehicleQuery.in('make', criteria.vehicle.make)
        }
        if (criteria.vehicle.model && criteria.vehicle.model.length > 0) {
            vehicleQuery.in('model', criteria.vehicle.model)
        }
        if (criteria.vehicle.year) {
            if (criteria.vehicle.year.min !== undefined) {
                vehicleQuery.gte('year', criteria.vehicle.year.min)
            }
            if (criteria.vehicle.year.max !== undefined) {
                vehicleQuery.lte('year', criteria.vehicle.year.max)
            }
        }

        const { data: vehicles, error: vehicleError } = await vehicleQuery

        if (vehicleError) throw vehicleError
        if (!vehicles || vehicles.length === 0) {
            return []
        }

        // Get unique customer IDs from vehicles
        const vehicleCustomerIds = [...new Set(vehicles.map(v => v.customer_id))]
        customerIds = customerIds.filter(id => vehicleCustomerIds.includes(id))
    }

    // Step 3: Apply service type filter (if specified)
    if (criteria.serviceType?.has && criteria.serviceType.has.length > 0) {
        // Get work orders for these customers
        const { data: workOrders, error: workOrderError } = await supabase
            .from('work_orders')
            .select('customer_id, id')
            .eq('shop_id', shopId)
            .in('customer_id', customerIds)

        if (workOrderError) throw workOrderError

        if (!workOrders || workOrders.length === 0) {
            return []
        }

        const workOrderIds = workOrders.map(wo => wo.id)

        // Get work order items with matching service types
        const { data: workOrderItems, error: itemsError } = await supabase
            .from('work_order_items')
            .select('work_order_id, description')
            .in('work_order_id', workOrderIds)
            .in('item_type', ['service', 'labor'])

        if (itemsError) throw itemsError

        if (!workOrderItems || workOrderItems.length === 0) {
            return []
        }

        // Filter by service type in description
        const matchingWorkOrderIds = workOrderItems
            .filter(item => {
                const description = (item.description || '').toLowerCase()
                return criteria.serviceType!.has!.some(serviceType =>
                    description.includes(serviceType.toLowerCase())
                )
            })
            .map(item => item.work_order_id)

        const matchingCustomerIds = workOrders
            .filter(wo => matchingWorkOrderIds.includes(wo.id))
            .map(wo => wo.customer_id)

        customerIds = customerIds.filter(id => matchingCustomerIds.includes(id))
    }

    // Step 4: Apply last service date filter (if specified)
    if (criteria.lastServiceDate) {
        const invoiceQuery = supabase
            .from('invoices_table')
            .select('customer_id, created_at')
            .eq('shop_id', shopId)
            .in('customer_id', customerIds)
            .order('created_at', { ascending: false })

        const { data: invoices, error: invoiceError } = await invoiceQuery

        if (invoiceError) throw invoiceError

        if (!invoices || invoices.length === 0) {
            return []
        }

        // Group by customer and get most recent invoice date
        const customerLastService: Record<string, string> = {}
        invoices.forEach(invoice => {
            const customerId = invoice.customer_id
            if (!customerLastService[customerId] || 
                invoice.created_at > customerLastService[customerId]) {
                customerLastService[customerId] = invoice.created_at
            }
        })

        // Filter by date criteria
        customerIds = customerIds.filter(customerId => {
            const lastService = customerLastService[customerId]
            if (!lastService) return false

            if (criteria.lastServiceDate!.before) {
                if (lastService >= criteria.lastServiceDate!.before) return false
            }
            if (criteria.lastServiceDate!.after) {
                if (lastService <= criteria.lastServiceDate!.after) return false
            }
            return true
        })
    }

    // Step 5: Apply total spent filter (if specified)
    if (criteria.totalSpent) {
        const { data: invoices, error: invoiceError } = await supabase
            .from('invoices_table')
            .select('customer_id, total_amount')
            .eq('shop_id', shopId)
            .in('customer_id', customerIds)

        if (invoiceError) throw invoiceError

        // Calculate total spent per customer
        const customerTotals: Record<string, number> = {}
        invoices?.forEach(invoice => {
            const customerId = invoice.customer_id
            customerTotals[customerId] = (customerTotals[customerId] || 0) + (invoice.total_amount || 0)
        })

        // Filter by total spent criteria
        customerIds = customerIds.filter(customerId => {
            const total = customerTotals[customerId] || 0
            if (criteria.totalSpent!.above !== undefined && total <= criteria.totalSpent!.above) {
                return false
            }
            if (criteria.totalSpent!.below !== undefined && total >= criteria.totalSpent!.below) {
                return false
            }
            return true
        })
    }

    // Step 6: Apply days since last visit filter (if specified)
    if (criteria.daysSinceLastVisit) {
        const { data: invoices, error: invoiceError } = await supabase
            .from('invoices_table')
            .select('customer_id, created_at')
            .eq('shop_id', shopId)
            .in('customer_id', customerIds)
            .order('created_at', { ascending: false })

        if (invoiceError) throw invoiceError

        // Get most recent invoice per customer
        const customerLastVisit: Record<string, Date> = {}
        invoices?.forEach(invoice => {
            const customerId = invoice.customer_id
            const visitDate = new Date(invoice.created_at)
            if (!customerLastVisit[customerId] || visitDate > customerLastVisit[customerId]) {
                customerLastVisit[customerId] = visitDate
            }
        })

        const now = new Date()

        // Filter by days since last visit
        customerIds = customerIds.filter(customerId => {
            const lastVisit = customerLastVisit[customerId]
            if (!lastVisit) return false

            const daysSince = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

            if (criteria.daysSinceLastVisit!.min !== undefined && daysSince < criteria.daysSinceLastVisit!.min) {
                return false
            }
            if (criteria.daysSinceLastVisit!.max !== undefined && daysSince > criteria.daysSinceLastVisit!.max) {
                return false
            }
            return true
        })
    }

    return customerIds
}

// Alias for backward compatibility
export const getMatchingCustomerIds = buildSegmentQuery

