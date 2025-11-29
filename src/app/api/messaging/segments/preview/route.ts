import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import type { CustomerSegment } from '@/app/(features)/messaging/types/mass-campaign'

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const segment: CustomerSegment = await request.json()
        const supabase = await createClient()

        // Start with basic customer query - all customers with valid phone numbers
        // Filter out NULL, 'NULL' string, and empty strings
        let query = supabase
            .from('customers')
            .select('id, customer_name, customer_phone, customer_email, tags')
            .eq('shop_id', shopId)
            .not('customer_phone', 'is', null)
            .neq('customer_phone', '')
            .neq('customer_phone', 'NULL')

        // Check if segment has any meaningful filters
        const hasFilters = segment && Object.keys(segment).length > 0 && 
            Object.values(segment).some(v => {
                if (Array.isArray(v)) return v.length > 0
                if (typeof v === 'string') return v.trim().length > 0
                if (typeof v === 'number') return v > 0
                return v !== null && v !== undefined
            })

        if (hasFilters) {
            // Apply customer tags filter - check if any of the segment tags exist in customer tags
            if (segment.customer_tags && segment.customer_tags.length > 0) {
                // Use overlaps operator for customer_tag[] array intersection
                query = query.overlaps('tags', segment.customer_tags)
            }

            if (segment.include_customer_ids && segment.include_customer_ids.length > 0) {
                query = query.in('id', segment.include_customer_ids)
            }

            if (segment.exclude_customer_ids && segment.exclude_customer_ids.length > 0) {
                query = query.not('id', 'in', segment.exclude_customer_ids)
            }

            // Apply vehicle make filter if specified
            if (segment.vehicle_makes && segment.vehicle_makes.length > 0) {
                // We'll need to join with customer_vehicles table for this
                query = query.select(`
                    id, customer_name, customer_phone, customer_email, tags,
                    customer_vehicles!inner(make)
                `)
                query = query.in('customer_vehicles.make', segment.vehicle_makes)
            }
        }

        const { data: customers, error } = await query

        if (error) throw error

        // For empty segment (all customers), return all
        let filtered = customers || []

        // Apply additional filters that require work orders (if segment has those filters)
        if (hasFilters && (segment.last_service_date_from || segment.last_service_date_to || 
            (segment.service_types && segment.service_types.length > 0) ||
            segment.last_visit_days)) {
            
            const customerIds = filtered.map(c => c.id)
            if (customerIds.length === 0) {
                return NextResponse.json({ count: 0, sample_customers: [] })
            }
            
            const { data: workOrders } = await supabase
                .from('work_orders')
                .select('customer_id, title, completed_at')
                .in('customer_id', customerIds)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })

            // Group by customer and get last service date
            const lastServiceByCustomer = new Map<string, Date>()
            const servicesByCustomer = new Map<string, Set<string>>()

            workOrders?.forEach(wo => {
                if (!wo.completed_at) return
                const completedDate = new Date(wo.completed_at)
                const existing = lastServiceByCustomer.get(wo.customer_id)
                
                if (!existing || completedDate > existing) {
                    lastServiceByCustomer.set(wo.customer_id, completedDate)
                }

                if (wo.title) {
                    const lowerTitle = wo.title.toLowerCase()
                    if (!servicesByCustomer.has(wo.customer_id)) {
                        servicesByCustomer.set(wo.customer_id, new Set())
                    }
                    servicesByCustomer.get(wo.customer_id)!.add(lowerTitle)
                }
            })

            // Apply last visit days filter
            if (segment.last_visit_days) {
                const cutoffDate = new Date()
                cutoffDate.setDate(cutoffDate.getDate() - segment.last_visit_days)
                
                filtered = filtered.filter(customer => {
                    const lastService = lastServiceByCustomer.get(customer.id)
                    return lastService && lastService >= cutoffDate
                })
            }

            // Apply date range filters
            if (segment.last_service_date_from || segment.last_service_date_to) {
                filtered = filtered.filter(customer => {
                    const lastService = lastServiceByCustomer.get(customer.id)
                    if (!lastService) return false

                    if (segment.last_service_date_from) {
                        if (lastService < new Date(segment.last_service_date_from)) return false
                    }
                    if (segment.last_service_date_to) {
                        if (lastService > new Date(segment.last_service_date_to)) return false
                    }
                    return true
                })
            }

            // Apply service type filters with better matching
            if (segment.service_types && segment.service_types.length > 0) {
                filtered = filtered.filter(customer => {
                    const customerServices = servicesByCustomer.get(customer.id)
                    if (!customerServices) return false
                    
                    return segment.service_types!.some(type => {
                        // Create multiple variations to match against
                        const variations = [
                            type.toLowerCase(),
                            type.toLowerCase().replace(/_/g, ' '),
                            type.toLowerCase().replace(/_/g, '-'),
                            type.replace(/_/g, ' ').toLowerCase()
                        ]
                        
                        return Array.from(customerServices).some(service => 
                            variations.some(variation => service.includes(variation))
                        )
                    })
                })
            }
        }

        // Apply total spent filters if specified
        if (hasFilters && (segment.total_spent_min || segment.total_spent_max)) {
            // Total spent filtering not yet implemented
            // Would require joining with work_orders and summing amounts
        }

        // Return count and sample
        return NextResponse.json({
            count: filtered.length,
            sample_customers: filtered.slice(0, 10).map(c => ({
                id: c.id,
                customer_name: c.customer_name,
                customer_phone: c.customer_phone,
                customer_email: c.customer_email,
                tags: c.tags || []
            })),
            debug: {
                hasFilters,
                segmentKeys: Object.keys(segment),
                queryFilters: hasFilters ? 'Applied' : 'None (All Customers)'
            }
        })

    } catch (error: any) {
        console.error('Error previewing segment:', error)
        return NextResponse.json(
            { error: 'Failed to preview segment', details: error.message },
            { status: 500 }
        )
    }
}

