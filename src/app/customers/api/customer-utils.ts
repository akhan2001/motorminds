import { supabase } from "@/lib/supabase";

/**
 * Fetch customers from the "customers" table filtered by shopId
 */
export async function getCustomers(shopId: string) {
    console.log("Reached here in the api");
    
    try {
        if (!shopId || shopId === "null") {
            console.error("Invalid shop ID:", shopId);
            return [];
        }
        
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId);
    
        if (error) {
            console.error("Supabase error:", error.message, error);
            return [];
        }
        
        return data || [];
    } catch (err) {
        console.error("Unexpected error in getCustomers:", err);
        return [];
    }
}

export async function createNewCustomer(customer: any) {
    const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select();

    if (error) {
        console.error('Error creating customer:', error);
        return null;
    }

    return data;
}