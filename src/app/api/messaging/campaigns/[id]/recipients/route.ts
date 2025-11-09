import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await context.params
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const supabase = await createClient()

        // Verify campaign belongs to shop
        const { data: campaign, error: campaignError } = await supabase
            .from('ai_mass_campaigns')
            .select('id')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single()

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        // Get recipients
        let query = supabase
            .from('ai_mass_campaign_recipients')
            .select(`
                *,
                customer:customers(id, customer_name, customer_email)
            `)
            .eq('campaign_id', id)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }

        const { data: recipients, error } = await query

        if (error) throw error

        return NextResponse.json({ recipients: recipients || [] })

    } catch (error: any) {
        console.error('Error fetching recipients:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recipients', details: error.message },
            { status: 500 }
        )
    }
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
        const { customer_ids } = await request.json()

        if (!customer_ids || !Array.isArray(customer_ids)) {
            return NextResponse.json({ error: 'customer_ids array required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Verify campaign belongs to shop and is in draft status
        const { data: campaign, error: campaignError } = await supabase
            .from('ai_mass_campaigns')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single()

        if (campaignError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        if (campaign.status !== 'draft') {
            return NextResponse.json(
                { error: 'Can only add recipients to draft campaigns' },
                { status: 400 }
            )
        }

        // Get customer details
        const { data: customers, error: customersError } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone')
            .in('id', customer_ids)
            .eq('shop_id', shopId)
            .not('customer_phone', 'is', null)

        if (customersError) throw customersError

        if (!customers || customers.length === 0) {
            return NextResponse.json(
                { error: 'No valid customers found' },
                { status: 400 }
            )
        }

        // Create recipient records
        const recipients = customers.map(c => ({
            campaign_id: id,
            customer_id: c.id,
            customer_phone: c.customer_phone,
            status: 'pending',
            interpolated_message: campaign.message // Will be replaced with variables later
        }))

        const { error: insertError } = await supabase
            .from('ai_mass_campaign_recipients')
            .insert(recipients)

        if (insertError) throw insertError

        // Update total_recipients count
        const { count } = await supabase
            .from('ai_mass_campaign_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', id)

        await supabase
            .from('ai_mass_campaigns')
            .update({ total_recipients: count || 0 })
            .eq('id', id)

        return NextResponse.json({ 
            success: true, 
            added: recipients.length 
        })

    } catch (error: any) {
        console.error('Error adding recipients:', error)
        return NextResponse.json(
            { error: 'Failed to add recipients', details: error.message },
            { status: 500 }
        )
    }
}

