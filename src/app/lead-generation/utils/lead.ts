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

export const createLead = async (leadFormData: any) => {
    // console.log(lead)

    const shopName = await getShopName(leadFormData.shop_id)
    // console.log(shopName)
	const { data, error } = await supabase
        .from("leads")
        .insert({
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

export async function getTotalLeads() {
    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        throw error
    }

    return data
}

export async function getHotLeads() {
    const data = await getTotalLeads()
    const hotLeads = data.filter((lead: any) => lead.status === "INTERESTED")
    return hotLeads.length
}

export async function getPendingFollowUps() {
    const data = await getTotalLeads()
    const pendingFollowUps = data.filter((lead: any) => lead.status === "FOLLOW UP")
    return pendingFollowUps.length
}

export async function getConvertedLeads() {
    const data = await getTotalLeads()
    const convertedLeads = data.filter((lead: any) => lead.status === "CUSTOMER")
    return convertedLeads.length
}


