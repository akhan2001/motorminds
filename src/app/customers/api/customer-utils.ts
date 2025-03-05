import { supabase } from "@/lib/supabase";

export async function getCustomers() {
    const { data, error } = await supabase
        .from('customers')
        .select('customer_name, customer_email, customer_phone, customer_address, id');

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    // console.log(data);
    return data;
}
