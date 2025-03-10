import { supabase } from "@/lib/supabase";

export async function getShopStaffNames(shopId: string) {
    const { data, error } = await supabase
        .from('shop_staff')
        .select('role, staff_name, id')
        .eq('shop_id', shopId);

    if (error) {
        console.error("Error fetching shop staff:", error);
        return [];
    }

    return data || [];
}
