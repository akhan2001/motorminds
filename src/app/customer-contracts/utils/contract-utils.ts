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
        .select('*')
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

export async function generateContractText(payload: any) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        toast.error("The OpenAI API key is missing. Please add it to your environment variables to use this feature.");
        return null;
    }

    const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    const { customer, vehicle, contract_details } = payload;
     
    const { data: shop, error: shopError } = await supabase.from("shops").select("*").eq("id", payload.shopId).single();
    if (shopError || !shop) {
         toast.error("Could not fetch shop details for AI generation.");
         return null;
    }

    const prompt = `
      You are a legal assistant for an auto repair shop. Generate a service contract.
      
      Shop Information:
      - Name: ${shop.shop_name}
      - Address: ${shop.shop_address}
      - Phone: ${shop.shop_phone}
      - Email: ${shop.shop_email}

      Customer Information:
      - Name: ${customer.customer_name}
      - Address: ${customer.customer_address}
      - Email: ${customer.customer_email}
      - Phone: ${customer.customer_phone}

      Vehicle Information:
      - Make: ${vehicle.make}
      - Model: ${vehicle.model}
      - Year: ${vehicle.year}
      - VIN: ${vehicle.vin}

      Contract Details:
      - Title: ${contract_details.title}

      Generate a professional and clear service contract text based on the information provided. The tone should be formal. Ensure all key details are included. The contract should include sections for "Scope of Work", "Payment Terms", "Authorization", and signature lines for both the shop representative and the customer.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
        });
        return { generated_text: completion.choices[0].message.content };
    } catch (error) {
        console.error("AI generation failed:", error);
        toast.error("AI generation failed.");
        return null;
    }
} 