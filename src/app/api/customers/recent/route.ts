import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

/**
 * GET /api/customers/recent - Get recently active customers
 * 
 * Returns customers who have had recent work orders or invoices,
 * sorted by most recent activity.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser(supabase);

        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get customers with recent work orders (sorted by most recent)
        const { data: recentWorkOrders, error: woError } = await supabase
            .from('work_orders')
            .select(`
                customer_id,
                created_at,
                customers (
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_address,
                    shop_id,
                    updated_at
                )
            `)
            .eq('shop_id', shopId)
            .not('customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (woError) {
            console.error('Error fetching recent work orders:', woError);
        }

        // Get customers with recent invoices
        const { data: recentInvoices, error: invError } = await supabase
            .from('invoices_table')
            .select(`
                customer_id,
                created_at,
                customers (
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_address,
                    shop_id,
                    updated_at
                )
            `)
            .eq('shop_id', shopId)
            .not('customer_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50);

        if (invError) {
            console.error('Error fetching recent invoices:', invError);
        }

        // Combine and deduplicate customers, keeping track of most recent activity
        const customerActivityMap = new Map<string, { customer: any; lastActivity: string }>();

        // Process work orders
        recentWorkOrders?.forEach((wo) => {
            if (wo.customers && wo.customer_id) {
                const existing = customerActivityMap.get(wo.customer_id);
                if (!existing || new Date(wo.created_at) > new Date(existing.lastActivity)) {
                    customerActivityMap.set(wo.customer_id, {
                        customer: wo.customers,
                        lastActivity: wo.created_at
                    });
                }
            }
        });

        // Process invoices
        recentInvoices?.forEach((inv) => {
            if (inv.customers && inv.customer_id) {
                const existing = customerActivityMap.get(inv.customer_id);
                if (!existing || new Date(inv.created_at) > new Date(existing.lastActivity)) {
                    customerActivityMap.set(inv.customer_id, {
                        customer: inv.customers,
                        lastActivity: inv.created_at
                    });
                }
            }
        });

        // Sort by most recent activity and take the top N
        const recentCustomers = Array.from(customerActivityMap.values())
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
            .slice(0, limit)
            .map(item => ({
                ...item.customer,
                lastActivity: item.lastActivity
            }));

        return NextResponse.json({
            customers: recentCustomers,
            count: recentCustomers.length
        });

    } catch (error) {
        console.error('GET /api/customers/recent error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
