import { supabase } from "@/lib/supabase"

export const getLeads = async () => {
	const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })

	if (error) {
		throw error
	}
	return data
}

export const getShopName = async (shop_id: any) => {
	const { data, error } = await supabase
    .from("shops")
    .select("shop_name")
    .eq("id", shop_id)
    .single()
	
    if (error) {
		throw error
	}
    
	return data
}

export const createLead = async (lead: any) => {
    // console.log(lead)

    const shopName = await getShopName(lead.shop_id)
    // console.log(shopName)

	const { data, error } = await supabase
        .from("leads")
        .insert({
            shop_name: shopName.shop_name,
            customer_name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
            status: "NEW",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),            
        })
        .select()

	if (error) {
		throw error
	}

	return data;
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
}