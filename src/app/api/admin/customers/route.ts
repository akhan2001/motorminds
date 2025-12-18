import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const shopId = searchParams.get('shopId');
        const search = searchParams.get('search');

        // Build query
        let query = supabase
            .from('customers')
            .select(`
                *,
                shops:shop_id (
                    shop_name,
                    shop_email
                )
            `)
            .order('customer_name', { ascending: true });

        // Filter by shop if provided
        if (shopId && shopId !== 'all') {
            query = query.eq('shop_id', shopId);
        }

        // Search filter
        if (search) {
            query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
        }

        const { data: customers, error } = await query;

        if (error) {
            console.error('Error fetching customers:', error);
            return NextResponse.json(
                { error: 'Failed to fetch customers', details: error.message },
                { status: 500 }
            );
        }

        if (!customers || customers.length === 0) {
            return NextResponse.json({
                customers: [],
                total: 0
            });
        }

        // Batch fetch all invoice data in a single query to avoid N+1 problem
        const customerIds = customers.map(c => c.id);

        // Fetch all invoices for all customers in one query
        const { data: allInvoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('customer_id, amount, status')
            .in('customer_id', customerIds);

        if (invoicesError) {
            console.error('Error fetching invoices:', invoicesError);
            // Continue with empty stats if invoice fetch fails
        }

        // Aggregate invoice data by customer_id in memory
        const invoiceStats = new Map<string, { count: number; outstandingBalance: number }>();

        // Initialize all customers with zero stats
        customerIds.forEach(id => {
            invoiceStats.set(id, { count: 0, outstandingBalance: 0 });
        });

        // Process invoices and aggregate stats
        (allInvoices || []).forEach(invoice => {
            const stats = invoiceStats.get(invoice.customer_id) || { count: 0, outstandingBalance: 0 };
            stats.count += 1;

            if (invoice.status === 'UNPAID' && invoice.amount) {
                stats.outstandingBalance += invoice.amount;
            }

            invoiceStats.set(invoice.customer_id, stats);
        });

        // Map customers with their aggregated stats
        const customersWithStats = customers.map(customer => {
            const stats = invoiceStats.get(customer.id) || { count: 0, outstandingBalance: 0 };
            return {
                ...customer,
                invoice_count: stats.count,
                outstanding_balance: stats.outstandingBalance
            };
        });

        return NextResponse.json({
            customers: customersWithStats,
            total: customersWithStats.length
        });

    } catch (error) {
        console.error('Error in admin customers API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
