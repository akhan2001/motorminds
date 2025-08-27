import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        const supabase = await createClient();
        let query = supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .order('customer_name', { ascending: true });

        if (search) {
            query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
        }

        const { data: customers, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(customers);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customer_name, customer_email, customer_phone, customer_address } = body;

        const supabase = await createClient();
        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                shop_id: shopId,
                customer_name,
                customer_email,
                customer_phone,
                customer_address
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(customer);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
