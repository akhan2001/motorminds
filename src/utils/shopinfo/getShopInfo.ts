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

export async function getShopStaff(shopId: string) {
    const { data, error } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId);
        
    if (error) {
        console.error('Error fetching shop staff:', error);
        throw error;
    }

    return data;
}

export async function addShopStaff(staff: any, shopId: string) {
    try {
        const { data, error } = await supabase
            .from('shop_staff')
            .insert({
                shop_id: shopId,
                role: staff.role,
                staff_name: staff.staff_name
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding shop staff:', error);
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error adding shop staff:', error);
        return { success: false, error };
    }
}
