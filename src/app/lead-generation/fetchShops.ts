// src/utils/fetchShops.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchShops(shopID?: string) {

    if (shopID) {
        const { data, error } = await supabase.from('shops').select('*').eq('id', shopID);

        if (error) {
            console.error('Error fetching shop:', error.message);
            return [];
        }

        console.log(data);
        return data;
    } else {
        const { data, error } = await supabase.from('shops').select('*');
    
        if (error) {
            console.error('Error fetching shops:', error.message);
            return [];
        }

        console.log(data);
        return data;
    }
}