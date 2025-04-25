import { supabase } from "@/lib/supabase"

export async function createWorkOrder(workOrderData: any) {
    const { data, error } = await supabase
        .from("repair_orders")
        .insert(workOrderData)
        .select()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getRepairOrders(shopId: string) {
    const { data, error } = await supabase
        .from("repair_orders")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
    
    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function openRepairOrder(orderId: string) {
    const { data, error } = await supabase
        .from("repair_orders")
        .update({ status: "open" })
        .eq("id", orderId)

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function shopHasServices(shopId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from("shop_services")
        .select("*", { count: "exact" })
        .eq("shop_id", shopId)
    
    if (error) {
        console.error("Error checking shop services:", error)
        return false
    }
    
    return count !== null && count > 0
}

export async function seedDefaultServices(shopId: string, defaultServices: any[]): Promise<boolean> {
    try {
        // Add shop_id to each service
        const servicesWithShopId = defaultServices.map(service => ({
            ...service,
            shop_id: shopId
        }))
        
        const { error } = await supabase
            .from("shop_services")
            .insert(servicesWithShopId)
        
        if (error) {
            console.error("Error seeding default services:", error)
            return false
        }
        
        return true
    } catch (error) {
        console.error("Error in seedDefaultServices:", error)
        return false
    }
}

export async function resetShopServices(shopId: string, defaultServices: any[]): Promise<boolean> {
    try {
        // First, delete all existing services for the shop
        const { error: deleteError } = await supabase
            .from("shop_services")
            .delete()
            .eq("shop_id", shopId)
        
        if (deleteError) {
            console.error("Error deleting existing services:", deleteError)
            return false
        }
        
        // Then seed with default services
        return await seedDefaultServices(shopId, defaultServices)
    } catch (error) {
        console.error("Error in resetShopServices:", error)
        return false
    }
}



