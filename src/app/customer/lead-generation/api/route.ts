// src/utils/fetchShops.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select('id, name, address, city, province, phone, email, logo_url')
            // Only select fields that are safe to expose
            // Avoid selecting sensitive data

        if (error) {
            console.error('Error fetching shops:', error.message);
            return NextResponse.json(
                { error: 'Failed to fetch shops' }, 
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' }, 
            { status: 500 }
        );
    }
}