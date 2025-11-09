import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { replaceVariables } from '@/app/(features)/messaging/lib/variable-replacer'
import type { CustomerSegment } from '@/app/(features)/messaging/types/mass-campaign'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side function to get customers matching a segment
 * Similar to getSegmentCustomers but uses server-side Supabase client
 */
async function getSegmentCustomersServer(
    supabase: SupabaseClient,
    shopId: string,
    segment: CustomerSegment
) {
    // Start with basic customer query - filter out NULL, 'NULL' string, and empty strings
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
        // Apply customer tags filter
        if (segment.customer_tags && segment.customer_tags.length > 0) {
            query = query.overlaps('tags', segment.customer_tags)
        }

        if (segment.include_customer_ids && segment.include_customer_ids.length > 0) {
            query = query.in('id', segment.include_customer_ids)
        }

        if (segment.exclude_customer_ids && segment.exclude_customer_ids.length > 0) {
            query = query.not('id', 'in', segment.exclude_customer_ids)
        }
    }

    const { data: customers, error } = await query
    if (error) throw error

    let filtered = customers || []

    // Apply additional filters that require work orders
    if (hasFilters && (segment.last_service_date_from || segment.last_service_date_to || 
        (segment.service_types && segment.service_types.length > 0) ||
        segment.last_visit_days)) {
        
        const customerIds = filtered.map(c => c.id)
        if (customerIds.length === 0) return []

        const { data: workOrders } = await supabase
            .from('work_orders')
            .select('customer_id, title, completed_at')
            .in('customer_id', customerIds)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })

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

        // Apply service type filters
        if (segment.service_types && segment.service_types.length > 0) {
            filtered = filtered.filter(customer => {
                const customerServices = servicesByCustomer.get(customer.id)
                if (!customerServices) return false
                
                return segment.service_types!.some(type => {
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

    // Filter by vehicle attributes if specified
    if (hasFilters && segment.vehicle_makes && segment.vehicle_makes.length > 0) {
        filtered = filtered.filter(customer =>
            (customer.customer_vehicles as any[])?.some((v: any) =>
                segment.vehicle_makes?.includes(v.make)
            )
        )
    }

    if (hasFilters && segment.vehicle_models && segment.vehicle_models.length > 0) {
        filtered = filtered.filter(customer =>
            (customer.customer_vehicles as any[])?.some((v: any) =>
                segment.vehicle_models?.includes(v.model)
            )
        )
    }

    if (hasFilters && segment.vehicle_years && segment.vehicle_years.length > 0) {
        filtered = filtered.filter(customer =>
            (customer.customer_vehicles as any[])?.some((v: any) =>
                segment.vehicle_years?.includes(v.year)
            )
        )
    }

    return filtered
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await context.params
        const supabase = await createClient()

        // Get campaign
        const { data: campaign, error: campaignError } = await supabase
            .from('ai_mass_campaigns')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single()

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        if (!['draft', 'scheduled'].includes(campaign.status)) {
            return NextResponse.json(
                { error: 'Campaign must be in draft or scheduled status' },
                { status: 400 }
            )
        }

        // Check if recipients already generated
        const { count: recipientCount } = await supabase
            .from('ai_mass_campaign_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)

        let recipients: any[] = []
        
        if (recipientCount === 0) {
            // Generate recipients using server-side logic
            const customers = await getSegmentCustomersServer(supabase, shopId, campaign.customer_segment)

            // Get shop info for variable replacement
            const { data: shop } = await supabase
                .from('shops')
                .select('shop_name, shop_phone, shop_address')
                .eq('id', shopId)
                .single()

            // Create recipients with interpolated messages
            recipients = customers.map(customer => {
                // Prepare template data
                const templateData: any = {
                    // Flat syntax
                    customer_name: customer.customer_name,
                    shop_name: shop?.shop_name || 'Your Auto Shop',
                    shop_phone: shop?.shop_phone || '',
                    // Nested syntax
                    customer: {
                        customer_name: customer.customer_name,
                        customer_phone: customer.customer_phone,
                        customer_email: customer.customer_email
                    },
                    shop: {
                        shop_name: shop?.shop_name || 'Your Auto Shop',
                        shop_phone: shop?.shop_phone || '',
                        shop_address: shop?.shop_address || ''
                    },
                    vehicle: null as any
                }

                // Add vehicle data if available
                if (customer.customer_vehicles && (customer.customer_vehicles as any[]).length > 0) {
                    const vehicle = (customer.customer_vehicles as any[])[0]
                    templateData.vehicle = {
                        make: vehicle.make || '',
                        model: vehicle.model || '',
                        year: vehicle.year?.toString() || ''
                    }
                    templateData.vehicle_make = vehicle.make || ''
                    templateData.vehicle_model = vehicle.model || ''
                    templateData.vehicle_year = vehicle.year?.toString() || ''
                }

                // Replace variables in message
                const messageBody = replaceVariables(campaign.message, templateData, {
                    missingVariableBehavior: 'empty'
                })

                return {
                    campaign_id: id,
                    customer_id: customer.id,
                    customer_phone: customer.customer_phone,
                    status: 'pending'
                }
            })

            if (recipients.length === 0) {
                return NextResponse.json(
                    { 
                        error: 'No customers match the segment criteria',
                        details: 'Please check your customer segment filters. Make sure you have customers with valid phone numbers that match your criteria.'
                    },
                    { status: 400 }
                )
            }

            // Insert recipients
            const { error: insertError } = await supabase
                .from('ai_mass_campaign_recipients')
                .insert(recipients)

            if (insertError) throw insertError

            // Update campaign total_recipients
            await supabase
                .from('ai_mass_campaigns')
                .update({ total_recipients: recipients.length })
                .eq('id', id)
        }

        // Update campaign status
        const scheduledFor = campaign.scheduled_send_at 
            ? new Date(campaign.scheduled_send_at)
            : null

        const newStatus = scheduledFor && scheduledFor > new Date()
            ? 'scheduled'
            : 'in_progress'

        await supabase
            .from('ai_mass_campaigns')
            .update({ status: newStatus })
            .eq('id', id)

        // If immediate, trigger processing synchronously
        if (newStatus === 'in_progress') {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                    || (request.headers.get('host')?.includes('localhost') 
                        ? `http://${request.headers.get('host')}` 
                        : `https://${request.headers.get('host')}`)

                console.log(`🚀 Triggering campaign processing for campaign ${id}...`)
                
                const processResponse = await fetch(`${baseUrl}/api/messaging/campaigns-process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })

                const processResult = await processResponse.json()
                
                if (!processResponse.ok) {
                    console.error('❌ Campaign processing failed:', processResult)
                    // Don't fail the send request, but log the error
                } else {
                    console.log(`✅ Campaign processing started:`, processResult)
                }
            } catch (err) {
                console.error('❌ Failed to trigger campaign processing:', err)
                // Don't fail the send request - cron will pick it up
            }
        }

        // Get final recipient count
        const finalRecipientCount = recipientCount > 0 
            ? recipientCount 
            : (recipients?.length || 0)

        return NextResponse.json({ 
            success: true, 
            status: newStatus,
            total_recipients: finalRecipientCount,
            message: newStatus === 'in_progress' 
                ? `Campaign is being sent to ${finalRecipientCount} recipients` 
                : 'Campaign scheduled'
        })

    } catch (error: any) {
        console.error('Error sending campaign:', error)
        return NextResponse.json(
            { error: 'Failed to send campaign', details: error.message },
            { status: 500 }
        )
    }
}

