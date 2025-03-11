// src/utils/fetchShops.ts
import { supabase } from '@/lib/supabase';

export async function getAllShops() {
    const { data, error } = await supabase
    .from('shops')
    .select('*');

    if (error) {
        console.error('Error fetching shops:', error.message);
        return [];
    }

    return data;
}

export async function fetchShop(shopId: string) {
    const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

    if (error) {
        console.error('Error fetching shop:', error.message);
        return null;
    }

    return data;
}
