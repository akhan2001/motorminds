import { supabase } from "@/lib/supabase";

export async function getInsightDetails(insightId: string) {
    const { data, error } = await supabase
        .from("mia_customer_insights")
        .select("*")
        .eq("id", insightId)
        .single();

    if (error) {
        throw error;
    }

    return data;
}
