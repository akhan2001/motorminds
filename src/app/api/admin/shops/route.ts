import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get all shops
        const { data: shops, error } = await supabase
            .from('shops')
            .select('*')
            .order('shop_name', { ascending: true });
        
        if (error) {
            console.error('Error fetching shops:', error);
            return NextResponse.json(
                { error: 'Failed to fetch shops', details: error.message },
                { status: 500 }
            );
        }
        
        // Get customer counts for each shop
        const shopsWithStats = await Promise.all(
            (shops || []).map(async (shop) => {
                const { count: customerCount } = await supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('shop_id', shop.id);
                
                return {
                    ...shop,
                    customer_count: customerCount || 0
                };
            })
        );
        
        return NextResponse.json({
            shops: shopsWithStats,
            total: shopsWithStats.length
        });
        
    } catch (error) {
        console.error('Error in admin shops API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
