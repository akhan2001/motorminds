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

export async function updateCustomer(customerId: string, customerData: any) {
    try {
        // Validate inputs
        if (!customerId) {
            throw new Error('Customer ID is required');
        }

        if (!customerData.customerName?.trim()) {
            throw new Error('Customer name is required');
        }

        // Prepare update data
        const updateData = {
            customer_name: customerData.customerName.trim(),
            customer_email: customerData.customerEmail?.trim() || null,
            customer_phone: customerData.customerPhone?.trim() || null,
            customer_address: customerData.customerAddress?.trim() || null,
            updated_at: new Date().toISOString()
        };

        // Perform update
        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customerId)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error.message);
            throw new Error(error.message);
        }

        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating customer:', error.message);
        } else {
            console.error('Error updating customer:', error);
        }
        return null;
    }
}

export async function deleteCustomer(customerId: string) {
    try {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting customer:', error);
        return false;
    }
}

export async function getCustomerVehicles(customerId: string) {
    const { data, error } = await supabase
        .from('customer_vehicles')
        .select('*')
        .eq('customer_id', customerId);
    
    if (error) {
        console.error('Error fetching customer vehicles:', error);
        return [];
    }

    return data || [];
}
