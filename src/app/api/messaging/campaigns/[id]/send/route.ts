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
    console.log(`🔍 [SEGMENT] Building customer query for shop ${shopId}`)
    console.log(`🔍 [SEGMENT] Segment filters:`, JSON.stringify(segment, null, 2))
    
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
    // Empty segment {} means "all customers", so hasFilters = false
    const hasFilters = segment && Object.keys(segment).length > 0 && 
        Object.values(segment).some(v => {
            if (Array.isArray(v)) return v.length > 0
            if (typeof v === 'string') return v.trim().length > 0
            if (typeof v === 'number') return v > 0
            return v !== null && v !== undefined
        })

    console.log(`🔍 [SEGMENT] Has filters: ${hasFilters}`)
    console.log(`🔍 [SEGMENT] Segment keys: ${segment ? Object.keys(segment).join(', ') : 'null'}`)
    
    // If no filters, return all customers (empty segment = all customers)
    if (!hasFilters) {
        console.log(`🔍 [SEGMENT] No filters - returning all customers with phone numbers`)
    }

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
    if (error) {
        console.error(`❌ [SEGMENT] Error querying customers:`, error)
        throw error
    }

    console.log(`🔍 [SEGMENT] Initial customer query returned ${customers?.length || 0} customers`)
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
        console.log(`🔍 [SEGMENT] After vehicle_years filter: ${filtered.length} customers`)
    }

    console.log(`✅ [SEGMENT] Final filtered customer count: ${filtered.length}`)
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

        console.log(`📋 [SEND] Starting send for campaign ${id}`)
        console.log(`📋 [SEND] Campaign data:`, {
            name: campaign.name,
            status: campaign.status,
            scheduled_send_at: campaign.scheduled_send_at,
            customer_segment: campaign.customer_segment
        })

        // Check if recipients already generated
        const { count: recipientCount } = await supabase
            .from('ai_mass_campaign_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)

        console.log(`📋 [SEND] Existing recipient count: ${recipientCount}`)

        let recipients: any[] = []
        
        if (recipientCount === 0) {
            console.log(`📋 [SEND] No recipients found, generating new ones...`)
            // Generate recipients using server-side logic
            const customers = await getSegmentCustomersServer(supabase, shopId, campaign.customer_segment)
            console.log(`📋 [SEND] Found ${customers.length} customers matching segment`)

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
            console.log(`📋 [SEND] Inserting ${recipients.length} recipients into database...`)
            const { error: insertError, data: insertedRecipients } = await supabase
                .from('ai_mass_campaign_recipients')
                .insert(recipients)
                .select()

            if (insertError) {
                console.error(`❌ [SEND] Error inserting recipients:`, insertError)
                throw insertError
            }

            console.log(`✅ [SEND] Successfully inserted ${insertedRecipients?.length || 0} recipients`)

            // Update campaign total_recipients with actual inserted count
            const actualCount = insertedRecipients?.length || recipients.length
            console.log(`📋 [SEND] Updating campaign total_recipients to ${actualCount}`)
            const { error: updateError } = await supabase
                .from('ai_mass_campaigns')
                .update({ total_recipients: actualCount })
                .eq('id', id)

            if (updateError) {
                console.error('❌ [SEND] Error updating total_recipients:', updateError)
                // Don't throw, but log the error
            } else {
                console.log(`✅ [SEND] Successfully updated campaign total_recipients`)
            }

            // Update recipients array for response
            recipients = insertedRecipients || recipients
        } else {
            // Recipients already exist, get the count from the campaign
            const { data: campaignData } = await supabase
                .from('ai_mass_campaigns')
                .select('total_recipients')
                .eq('id', id)
                .single()
            
            // If total_recipients is 0 but we have recipients, update it
            if (campaignData && campaignData.total_recipients === 0 && recipientCount && recipientCount > 0) {
                await supabase
                    .from('ai_mass_campaigns')
                    .update({ total_recipients: recipientCount })
                    .eq('id', id)
            }
        }

        // Update campaign status
        // Fix date comparison: compare dates at start of day to avoid timezone issues
        const scheduledFor = campaign.scheduled_send_at 
            ? new Date(campaign.scheduled_send_at)
            : null

        console.log(`📅 [SEND] Date comparison:`)
        console.log(`📅 [SEND] scheduled_send_at: ${campaign.scheduled_send_at}`)
        console.log(`📅 [SEND] scheduledFor Date object: ${scheduledFor}`)

        let newStatus: string
        if (scheduledFor) {
            // Compare dates by date string (YYYY-MM-DD) using local date to avoid timezone issues
            // Format dates in local timezone to get accurate date comparison
            const scheduledYear = scheduledFor.getFullYear()
            const scheduledMonth = String(scheduledFor.getMonth() + 1).padStart(2, '0')
            const scheduledDay = String(scheduledFor.getDate()).padStart(2, '0')
            const scheduledDateStr = `${scheduledYear}-${scheduledMonth}-${scheduledDay}`
            
            const today = new Date()
            const todayYear = today.getFullYear()
            const todayMonth = String(today.getMonth() + 1).padStart(2, '0')
            const todayDay = String(today.getDate()).padStart(2, '0')
            const todayDateStr = `${todayYear}-${todayMonth}-${todayDay}`
            
            console.log(`📅 [SEND] Scheduled date string (local): ${scheduledDateStr}`)
            console.log(`📅 [SEND] Today date string (local): ${todayDateStr}`)
            console.log(`📅 [SEND] Is scheduled date > today? ${scheduledDateStr > todayDateStr}`)
            
            // If scheduled date is today or in the past, send immediately
            // If scheduled date is in the future, keep as scheduled
            newStatus = scheduledDateStr > todayDateStr ? 'scheduled' : 'in_progress'
            console.log(`📅 [SEND] Determined status: ${newStatus}`)
        } else {
            newStatus = 'in_progress'
            console.log(`📅 [SEND] No scheduled date, status: ${newStatus}`)
        }

        console.log(`📋 [SEND] Updating campaign status to: ${newStatus}`)
        const { error: statusUpdateError } = await supabase
            .from('ai_mass_campaigns')
            .update({ status: newStatus })
            .eq('id', id)

        if (statusUpdateError) {
            console.error(`❌ [SEND] Error updating status:`, statusUpdateError)
        } else {
            console.log(`✅ [SEND] Successfully updated campaign status`)
        }

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

        // Get final recipient count - use the actual count from database
        const { data: finalCampaign } = await supabase
            .from('ai_mass_campaigns')
            .select('total_recipients')
            .eq('id', id)
            .single()
        
        const finalRecipientCount = finalCampaign?.total_recipients || recipientCount || recipients?.length || 0

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

