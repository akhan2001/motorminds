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

export async function getShopBranding(shopId: string) {
    const { data, error } = await supabase
        .from("shops")
        .select("shop_name, shop_about, shop_tagline, banner_image_url, logo_image_url")
        .eq("id", shopId)
        .single()

    if (error) throw error
    return data
}
