import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

// GET /api/twilio/phone-numbers - Get shop's phone numbers
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const { data: phoneNumbers, error } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
        }

        return NextResponse.json({ phoneNumbers });

    } catch (error) {
        console.error('GET /api/twilio/phone-numbers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}