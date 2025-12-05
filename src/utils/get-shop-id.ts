import { createClient } from "@/utils/supabase/server";

/**
 * Get shop ID for the current authenticated user
 * Uses getClaims() for proper JWT validation on the server
 */
export async function getShopIdForUser() {
    const supabase = await createClient();
    
    // Use getClaims() instead of getUser() for server-side auth
    // This validates the JWT signature locally and prevents spoofing
    const { data, error: claimsError } = await supabase.auth.getClaims();
    
    if (claimsError || !data?.claims) {
        console.error("getShopIdForUser - Claims Error:", claimsError);
        return null;
    }

    const userId = data.claims.sub;
    if (!userId) {
        return null;
    }

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
