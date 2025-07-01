import { supabase } from "@/lib/supabase";

export async function getShopId(userId: string) {
    const { data, error } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", userId)
        .single()
    if (error) throw error
    return data.shop_id
}

export async function getShopInfo(shopId: string) {
    const { data, error } = await supabase
        .from("shops")
        .select("shop_name, shop_address, shop_email, shop_phone")
        .eq("id", shopId)
        .single()
    if (error) throw error
    return data
}

export async function getShopName(shopId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('shop_name')
        .eq('id', shopId)
        .single();

    if (error) {
        console.error("Error fetching shop name:", error);
        return null;
    }

    return data?.shop_name || null;
}
