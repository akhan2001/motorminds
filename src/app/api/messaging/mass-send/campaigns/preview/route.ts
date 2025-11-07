import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { buildSegmentQuery } from "@/app/(features)/messaging/lib/customer-segment-builder";
import { createClient } from "@/utils/supabase/server";
import type { SegmentCriteria } from "@/app/(features)/messaging/types/segment";

// POST - Preview recipient count and sample customers (without campaign ID)
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customer_segment } = body;

        if (!customer_segment) {
            return NextResponse.json({ error: 'customer_segment is required' }, { status: 400 });
        }

        const segmentCriteria: SegmentCriteria = customer_segment;

        // Get matching customer IDs
        const customerIds = await buildSegmentQuery(shopId, segmentCriteria);

        // Get sample customers (first 10) with details
        const supabase = await createClient();
        const { data: sampleCustomers, error: sampleError } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone, customer_email, tags')
            .in('id', customerIds.slice(0, 10))
            .limit(10);

        if (sampleError) {
            console.error('Error fetching sample customers:', sampleError);
        }

        return NextResponse.json({
            count: customerIds.length,
            sample_customers: sampleCustomers || []
        });

    } catch (error) {
        console.error('Error previewing recipients:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

