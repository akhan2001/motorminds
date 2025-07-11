import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { OpenAI } from "openai";

// WARNING: Storing and using the OpenAI API key on the client-side is insecure.
// This is for demonstration purposes only and should be moved to a secure
// server-side API route in a production environment.


export async function fetchAllContracts(shopId: string) {
    if (!shopId) return [];
    const { data, error } = await supabase
        .from('service_contracts')
        .select(`
            id, 
            title, 
            content,
            status, 
            created_at, 
            customer_id,
            customer:customers (id, customer_name, customer_email, customer_phone, customer_address), 
            vehicle:customer_vehicles (id, make, model, year, vin)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        toast.error("Failed to fetch contracts.");
        console.error("Failed to fetch contracts:", JSON.stringify(error, null, 2));
        return [];
    }
    return data;
}

export async function fetchShopDetails(shopId: string) {
    if (!shopId) return null;
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

    if (error) {
        toast.error("Failed to fetch shop details.");
        console.error(error);
        return null;
    }
    return data;
}

export async function createContract(contractData: any) {
    const { data, error } = await supabase.from('service_contracts').insert(contractData).select().single();
    if (error) {
        toast.error("Failed to create contract.");
        console.error(error);
        return null;
    }
    toast.success("Contract created successfully!");
    return data;
}

export async function updateContract(contractId: string, contractData: any) {
    const { data, error } = await supabase.from('service_contracts').update(contractData).eq('id', contractId).select().single();
    if (error) {
        toast.error("Failed to update contract.");
        console.error(error);
        return null;
    }
    toast.success("Contract updated successfully!");
    return data;
}

export async function deleteContract(contractId: string) {
    const { error } = await supabase.from('service_contracts').delete().eq('id', contractId);
    if (error) {
        toast.error("Failed to delete contract.");
        console.error(error);
        return false;
    }
    toast.success("Contract deleted successfully!");
    return true;
} 