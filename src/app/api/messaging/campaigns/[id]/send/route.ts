import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { getSegmentCustomers } from '@/app/(features)/messaging/lib/segment-builder'
import { replaceVariables } from '@/app/(features)/messaging/lib/variable-replacer'

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

        if (recipientCount === 0) {
            // Generate recipients
            const customers = await getSegmentCustomers(shopId, campaign.customer_segment)

            // Get shop info for variable replacement
            const { data: shop } = await supabase
                .from('shops')
                .select('shop_name, shop_phone, shop_address')
                .eq('id', shopId)
                .single()

            // Create recipients with interpolated messages
            const recipients = customers.map(customer => {
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
                    status: 'pending',
                    interpolated_message: messageBody
                }
            })

            if (recipients.length === 0) {
                return NextResponse.json(
                    { error: 'No customers match the segment criteria' },
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

        // If immediate, trigger processing
        if (newStatus === 'in_progress') {
            // Trigger async processing (fire and forget)
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
                || (request.headers.get('host')?.includes('localhost') 
                    ? `http://${request.headers.get('host')}` 
                    : `https://${request.headers.get('host')}`)

            fetch(`${baseUrl}/api/messaging/campaigns-process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).catch(err => console.error('Failed to trigger campaign processing:', err))
        }

        return NextResponse.json({ 
            success: true, 
            status: newStatus,
            message: newStatus === 'in_progress' 
                ? 'Campaign is being sent' 
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

