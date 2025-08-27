import { createClient } from "@/utils/supabase/server";

export async function getShopIdForUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .select('shop_id')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error("getShopIdForUser Error:", error);
        return null;
    }

    return data.shop_id;
}
