import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { getSegmentCustomers } from '@/app/(features)/messaging/lib/segment-builder'
import type { CustomerSegment } from '@/app/(features)/messaging/types/mass-campaign'

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const segment: CustomerSegment = await request.json()

        // Get all matching customers
        const customers = await getSegmentCustomers(shopId, segment)

        return NextResponse.json({
            customers: customers.map(c => ({
                id: c.id,
                customer_name: c.customer_name,
                customer_phone: c.customer_phone,
                customer_email: c.customer_email
            }))
        })

    } catch (error: any) {
        console.error('Error fetching segment customers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers', details: error.message },
            { status: 500 }
        )
    }
}

