import { createClient } from "@/utils/supabase/server";

/**
 * Get shop ID for the current authenticated user
 * Uses getClaims() for robust JWT validation instead of getUser()
 */
export async function getShopIdForUser() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (!data?.claims?.sub) {
        return null;
    }

    const userId = data.claims.sub;

    const { data: userData, error } = await supabase
        .from('users')
        .select('shop_id')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error("getShopIdForUser Error:", error);
        return null;
    }

    return userData.shop_id;
}
