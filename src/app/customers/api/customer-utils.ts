import { supabase } from "@/lib/supabase";

/**
 * Fetch customers from the "customers" table filtered by shopId
 */
export async function getCustomers(shopId: string) {
  // Filter by shop_id for that specific user’s shop
  const { data, error } = await supabase
    .from("customers")
    .select("customer_name, customer_email, customer_phone, customer_address, id, shop_id")
    .eq("shop_id", shopId);

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  return data;
}
