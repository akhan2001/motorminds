import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/twilio/setup-phone - Add phone number to database
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get the first shop (or you can specify a shop ID)
        const { data: shops, error: shopError } = await supabase
            .from('shops')
            .select('id, shop_name')
            .limit(1);

        if (shopError || !shops || shops.length === 0) {
            return NextResponse.json({ error: 'No shops found' }, { status: 404 });
        }

        const shopId = shops[0].id;
        console.log('Using shop:', { id: shopId, name: shops[0].shop_name });

        // Add the Twilio phone number
        const { data: phoneNumber, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .upsert({
                shop_id: shopId,
                phone_number: '+16812244947',
                friendly_name: 'Main Business Line',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'shop_id,phone_number'
            })
            .select()
            .single();

        if (phoneError) {
            console.error('Failed to add phone number:', phoneError);
            return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 });
        }

        console.log('Phone number added:', phoneNumber);

        return NextResponse.json({
            success: true,
            phoneNumber,
            message: 'Phone number added successfully'
        });

    } catch (error) {
        console.error('Setup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/twilio/setup-phone - Check current phone numbers
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: phoneNumbers, error } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch phone numbers' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            phoneNumbers,
            count: phoneNumbers.length
        });

    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
