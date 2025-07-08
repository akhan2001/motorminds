import { getCustomerDetails } from "@/app/customers/api/customer-utils"
import { getInsightDetails } from "@/app/mia/utils/customerInsightsFunctions"
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/app/financials/utils/formatting";

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
    
    // Prepare rewards_claim data if a reward was selected
    let rewards_claim = null;
    if (leadFormData.reward_id && leadFormData.reward_name) {
        rewards_claim = {
            reward_id: leadFormData.reward_id,
            reward_name: leadFormData.reward_name,
            claimed_at: new Date().toISOString()
        };
    }
    
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
            rewards_claim: rewards_claim
        })
        .select()

	if (error) {
		throw error
	}

	return data;
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

export async function deleteLead(leadId: string, shopId: string) {
    const { data, error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)
        .eq("shop_id", shopId)
    
    if (error) {
        throw error
    }

    return data
}

export async function createCustomerLead(leadFormData: any) {
    const shopName = await getShopName(leadFormData.shop_id);

    const customerDetails = await getCustomerDetails(leadFormData.customer_id);
    
    const { data, error } = await supabase
        .from("leads")
        .insert({
            shop_id: leadFormData.shop_id,
            shop_name: shopName.shop_name,
            customer_name: customerDetails.customer_name,
            email: customerDetails.customer_email,
            phone: customerDetails.customer_phone,
            message: "This lead was created from Mia AI Insights.",
            status: "NEW",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: leadFormData.notes,
            repair_order_id: leadFormData.repair_order_id,
            vehicle_id: leadFormData.vehicle_id,
            customer_id: leadFormData.customer_id,
            insight_id: leadFormData.insight_id,
            lead_type: "Workorder",
            priority: "High",
            timeframe: "Immediate",
            follow_up_date: leadFormData.follow_up_date
        })
        .select()

    if (error) {
        throw error;
    }

    return data;
}
