import { supabase } from "@/lib/supabase"

export const getLeads = async (shopId: string) => {
	const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("shop_id", shopId)
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

export const createLead = async (leadFormData: any) => {
    // console.log(lead)

    const shopName = await getShopName(leadFormData.shop_id)
    // console.log(shopName)
	const { data, error } = await supabase
        .from("leads")
        .insert({
            shop_id: leadFormData.shop_id,
            shop_name: shopName.shop_name,
            customer_name: leadFormData.name,
            email: leadFormData.email,
            phone: leadFormData.phone,
            message: leadFormData.message,
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

export async function getTotalLeads(shopId: string) {
    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getNewLeads(shopId: string) {
    const data = await getTotalLeads(shopId)
    const newLeads = data.filter((lead: any) => lead.status === "NEW")
    return newLeads.length
}

export async function getPendingFollowUps(shopId: string) {
    const data = await getTotalLeads(shopId)
    const pendingFollowUps = data.filter((lead: any) => lead.status != "CUSTOMER")
    return pendingFollowUps.length
}

export async function getConvertedLeads(shopId: string) {
    const data = await getTotalLeads(shopId)
    const convertedLeads = data.filter((lead: any) => lead.status === "CUSTOMER")
    return convertedLeads.length
}

export async function updateLeadStatus(leadId: string, status: string) {
    const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", leadId)

    if (error) {
        throw error
    }

    return data 
}

export async function saveNotes(leadId: string, notes: string) {
    const { data, error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", leadId)

    if (error) {
        throw error
    }

    return data
}
