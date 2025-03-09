import { supabase } from "@/lib/supabase";

/**
 * Fetch customers from the "customers" table filtered by shopId
 */
export async function getCustomers(shopId: string) {
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

export async function createNewCustomer(customer: any, shopId: string) {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            customer_name: customer.customerName,
            customer_email: customer.customerEmail,
            customer_phone: customer.customerPhone,
            customer_address: customer.customerAddress,
            created_at: new Date().toISOString(),
            shop_id: shopId
        })
        .select();

    if (error) {
        console.error('Error creating customer:', error);
        return null;
    }

    return data;
}