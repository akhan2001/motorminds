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

