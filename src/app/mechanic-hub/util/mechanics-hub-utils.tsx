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

