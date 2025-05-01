import { supabase } from "@/lib/supabase"

export async function getCustomerRetention(shopId: string) {
    try {
        const { data, error } = await supabase
            .from('customer_retention')
            .select('*')
            .eq('shop_id', shopId)
        
        if (error) {
            console.error('Error fetching customer retention:', error)
            return { data: null, error }
        }
        
        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error fetching customer retention:', error)
        return { data: null, error }
    }
}

export async function updateRetentionStatus(taskId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('customer_retention')
            .update({ status })
            .eq('id', taskId)
            .select()

        if (error) {
            console.error('Error updating retention status:', error)
            return { success: false, error }
        }

        return { success: true, data, error: null }
    } catch (error) {
        console.error('Unexpected error updating retention status:', error)
        return { success: false, error }
    }
}

export async function getCustomerFromRetention(customerId: string) {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('customer_name')
            .eq('id', customerId)
            .single()

        if (error) {
            console.error('Error fetching customer from retention:', error)
            return { data: null, error }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error fetching customer from retention:', error)
        return { data: null, error }
    }
}

export async function getVehicleFromRetention(vehicleId: string) {
    try {
        const { data, error } = await supabase
            .from('customer_vehicles') 
            .select('*')
            .eq('id', vehicleId)
            .single()

        if (error) {
            console.error('Error fetching vehicle from retention:', error)  
            return { data: null, error }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error fetching vehicle from retention:', error)   
        return { data: null, error }
    }
}

export async function getWorkOrderFromRetention(workOrderId: string) {
    try {
        const { data, error } = await supabase
            .from('repair_orders')
            .select('*')
            .eq('id', workOrderId)
            .single()

        if (error) {
            console.error('Error fetching work order from retention:', error)
            return { data: null, error }
        }

        return { data, error: null }
    } catch (error) {
        console.error('Unexpected error fetching work order from retention:', error)
        return { data: null, error }
    }
}

