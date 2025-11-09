import { createClient } from '@/utils/supabase/client'
import type { CustomerSegment } from '../types/mass-campaign'

const supabase = createClient()

/**
 * Get customers matching a segment (for recipient generation)
 * Handles complex filtering including work orders and vehicles
 */
export async function getSegmentCustomers(
    shopId: string,
    segment: CustomerSegment
) {
    // Start with basic customer query
    let query = supabase
        .from('customers')
        .select(`
            id,
            customer_name,
            customer_phone,
            customer_email,
            tags,
            customer_vehicles(
                id,
                make,
                model,
                year,
                license_plate
            )
        `)
        .eq('shop_id', shopId)
        .not('customer_phone', 'is', null)

    // Apply basic filters
    if (segment.customer_tags && segment.customer_tags.length > 0) {
        query = query.contains('tags', segment.customer_tags)
    }

    if (segment.include_customer_ids && segment.include_customer_ids.length > 0) {
        query = query.in('id', segment.include_customer_ids)
    }

    if (segment.exclude_customer_ids && segment.exclude_customer_ids.length > 0) {
        query = query.not('id', 'in', segment.exclude_customer_ids)
    }

    const { data, error } = await query

    if (error) throw error

    let filtered = data || []

    // Filter by vehicle attributes if specified
    if (segment.vehicle_makes && segment.vehicle_makes.length > 0) {
        filtered = filtered.filter(customer => 
            (customer.customer_vehicles as any[])?.some((v: any) => 
                segment.vehicle_makes?.includes(v.make)
            )
        )
    }

    if (segment.vehicle_models && segment.vehicle_models.length > 0) {
        filtered = filtered.filter(customer => 
            (customer.customer_vehicles as any[])?.some((v: any) => 
                segment.vehicle_models?.includes(v.model)
            )
        )
    }

    if (segment.vehicle_years && segment.vehicle_years.length > 0) {
        filtered = filtered.filter(customer => 
            (customer.customer_vehicles as any[])?.some((v: any) => 
                segment.vehicle_years?.includes(v.year)
            )
        )
    }

    // Filter by service history if specified
    if (segment.last_service_date_from || segment.last_service_date_to || 
        (segment.service_types && segment.service_types.length > 0)) {
        
        const customerIds = filtered.map(c => c.id)
        
        const { data: workOrders, error: woError } = await supabase
            .from('work_orders')
            .select('customer_id, title, completed_at')
            .in('customer_id', customerIds)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })

        if (woError) throw woError

        // Group by customer and get last service date
        const lastServiceByCustomer = new Map<string, { date: Date; title: string }>()
        const servicesByCustomer = new Map<string, Set<string>>()

        workOrders?.forEach(wo => {
            if (!wo.completed_at) return

            const completedDate = new Date(wo.completed_at)
            const existing = lastServiceByCustomer.get(wo.customer_id)
            
            if (!existing || completedDate > existing.date) {
                lastServiceByCustomer.set(wo.customer_id, {
                    date: completedDate,
                    title: wo.title || ''
                })
            }

            // Track service types
            if (wo.title) {
                const serviceType = extractServiceType(wo.title)
                if (serviceType) {
                    if (!servicesByCustomer.has(wo.customer_id)) {
                        servicesByCustomer.set(wo.customer_id, new Set())
                    }
                    servicesByCustomer.get(wo.customer_id)!.add(serviceType)
                }
            }
        })

        // Apply date filters
        if (segment.last_service_date_from || segment.last_service_date_to) {
            filtered = filtered.filter(customer => {
                const lastService = lastServiceByCustomer.get(customer.id)
                if (!lastService) return false

                if (segment.last_service_date_from) {
                    if (lastService.date < new Date(segment.last_service_date_from)) return false
                }
                if (segment.last_service_date_to) {
                    if (lastService.date > new Date(segment.last_service_date_to)) return false
                }
                return true
            })
        }

        // Apply service type filter
        if (segment.service_types && segment.service_types.length > 0) {
            filtered = filtered.filter(customer => {
                const services = servicesByCustomer.get(customer.id)
                if (!services) return false
                return segment.service_types!.some(type => services.has(type))
            })
        }
    }

    return filtered
}

/**
 * Extract service type from work order title
 */
function extractServiceType(title: string): string | null {
    if (!title) return null
    
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('oil change')) return 'oil_change'
    if (lowerTitle.includes('brake')) return 'brake_service'
    if (lowerTitle.includes('tire rotation')) return 'tire_rotation'
    if (lowerTitle.includes('tire replacement') || lowerTitle.includes('new tire')) return 'tire_replacement'
    if (lowerTitle.includes('alignment')) return 'wheel_alignment'
    if (lowerTitle.includes('diagnostic')) return 'engine_diagnostic'
    if (lowerTitle.includes('transmission')) return 'transmission_service'
    if (lowerTitle.includes('battery')) return 'battery_service'
    if (lowerTitle.includes('air filter')) return 'air_filter_replacement'
    if (lowerTitle.includes('coolant') || lowerTitle.includes('radiator')) return 'coolant_flush'
    if (lowerTitle.includes('spark plug')) return 'spark_plug_replacement'
    if (lowerTitle.includes('inspection')) return 'general_inspection'
    
    return 'other'
}

/**
 * Count customers matching a segment (optimized for preview)
 */
export async function countSegmentCustomers(
    shopId: string,
    segment: CustomerSegment
): Promise<number> {
    const customers = await getSegmentCustomers(shopId, segment)
    return customers.length
}

