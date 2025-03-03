import { supabase } from '@/lib/supabase';

export async function getRewards() {
    const { data, error } = await supabase.from('rewards').select('*');
    if (error) {
        console.error('Error fetching rewards:', error);
        return [];
    }
    return data;
}

export async function getRewardsCount(shop_id: string) {
    // Get the number of rows in the rewards table
    const { count, error: countError } = await supabase
        .from('rewards')
        .select('*', { count: 'exact' })
        .eq('shop_id', shop_id);
    
    if (countError) {
        console.error('Error fetching rewards count:', countError);
        return 0;
    }
    return count;
}