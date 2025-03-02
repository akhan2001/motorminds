import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        console.log("Shop ID: ", data.shop_id);
        console.log("The timing is: ", new Date().toISOString());

        const { error } = await supabase
        .from('messages')
        .insert([{
            name: data.name,
            email: data.email,
            message: data.message,
            created_at: new Date().toISOString(),
            status: 'unread',
            phone_number: data.phone_number,
            shop_id: data.shop_id,
        }]);

        if (error) {
            console.error('Error inserting message:', error);
            return NextResponse.json({ success: false, error: 'Failed to insert message' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Message received' }, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
    }
}