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
