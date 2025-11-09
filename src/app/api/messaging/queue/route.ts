import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

// GET - List queue items (with filters: status, date range)
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const limit = parseInt(searchParams.get('limit') || '100');

        const supabase = await createClient();

        // Build query
        let query = supabase
            .from('ai_message_queue')
            .select('*')
            .eq('shop_id', shopId)
            .order('scheduled_send_at', { ascending: false })
            .limit(limit);

        // Apply status filter
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Apply date range filters
        if (startDate) {
            query = query.gte('scheduled_send_at', startDate);
        }
        if (endDate) {
            query = query.lte('scheduled_send_at', endDate);
        }

        const { data: queueItems, error } = await query;

        if (error) {
            console.error('Error fetching queue items:', error);
            return NextResponse.json(
                { error: 'Failed to fetch queue items', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            items: queueItems || [],
            count: queueItems?.length || 0
        });

    } catch (error) {
        console.error('Error fetching message queue:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
