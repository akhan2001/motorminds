import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

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

export async function getShopName(shopId: string) {
    const { data, error } = await supabase
        .from('shops')
        .select('shop_name')
        .eq('id', shopId);

    if (error) {
        console.error("Error fetching shop name:", error);
        return null;
    }

    return data;
}

export async function getShopInfo(shopId: string) {
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId);
    
    if (error) {
        console.error('Error fetching shop info:', error);
        throw error;
    }
    
    return data;
}

export async function updateShopInfo(shopId: string, shopInfo: any) {
    try {
        console.log(shopInfo);
        const { data, error } = await supabase
            .from('shops')
            .update(shopInfo)
            .eq('id', shopId);
            
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Error updating shop info:', error);
        return { success: false, error };
    }
}
