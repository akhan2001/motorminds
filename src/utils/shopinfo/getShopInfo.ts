import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function getShopStaffNames(shopId: string) {
    const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, role')
        .eq('shop_id', shopId)
        .is('termination_date', null); // Only fetch active employees

    if (error) {
        console.error("Error fetching shop staff:", error);
        return [];
    }

    // Combine first_name and last_name to create full names
    return data.map(staff => ({
        ...staff,
        full_name: `${staff.first_name || ''} ${staff.last_name || ''}`.trim()
    }));
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
    console.log('getShopInfo called with shopId:', shopId);
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId);
    
    console.log('getShopInfo query result:', { data, error });
    
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
        .from('employees')
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
