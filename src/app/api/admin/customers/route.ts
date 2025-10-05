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
        
        // Get invoice counts and outstanding balances for each customer
        const customersWithStats = await Promise.all(
            (customers || []).map(async (customer) => {
                // Get invoice count
                const { count: invoiceCount } = await supabase
                    .from('invoices')
                    .select('*', { count: 'exact', head: true })
                    .eq('customer_id', customer.id);
                
                // Get outstanding balance (unpaid invoices)
                const { data: unpaidInvoices } = await supabase
                    .from('invoices')
                    .select('amount')
                    .eq('customer_id', customer.id)
                    .eq('status', 'UNPAID');
                
                const outstandingBalance = unpaidInvoices?.reduce(
                    (sum, inv) => sum + (inv.amount || 0),
                    0
                ) || 0;
                
                return {
                    ...customer,
                    invoice_count: invoiceCount || 0,
                    outstanding_balance: outstandingBalance
                };
            })
        );
        
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
