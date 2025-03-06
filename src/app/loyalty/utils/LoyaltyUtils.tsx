import { supabase } from '@/lib/supabase';

export async function getRewards() {
    const { data, error } = await supabase.from('rewards').select('*');
    if (error) {
        console.error('Error fetching rewards:', error);
        return [];
    }
    return data;
}

export async function getRewardNames() {
    // Only get names of rewards that are active are are not duplicate
    const { data, error } = await supabase
        .from('rewards')
        .select('name')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching reward names:', error);
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

export async function getActiveRewards(shop_id: string) {
    const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('shop_id', shop_id)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching active rewards:', error);
        return [];
    }
    return data;
}

export async function getNumberOfRewardPoints(shop_id: string) {
    const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('shop_id', shop_id);

    // Sum the points from the rewards
    let totalPoints = 0;
    data?.forEach((reward) => {
        totalPoints += reward.points_required;
    });

    return totalPoints;
}
