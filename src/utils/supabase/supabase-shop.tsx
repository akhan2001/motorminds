import { supabase } from "@/lib/supabase";

// Request deduplication: Prevent multiple simultaneous shop_id queries
const shopIdCache = new Map<string, { promise: Promise<string>, timestamp: number }>()
const CACHE_DURATION = 1000 // 1 second cache to prevent thundering herd

export async function getShopId(userId: string) {
    const now = Date.now()
    const cached = shopIdCache.get(userId)

    // Return cached promise if request is already in flight or recently completed
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.promise
    }

    // Create new request and cache the promise
    const promise = supabase
        .from("users")
        .select("shop_id")
        .eq("id", userId)
        .single()
        .then(({ data, error }) => {
            if (error) throw error
            return data.shop_id
        })

    shopIdCache.set(userId, { promise, timestamp: now })

    // Clean up old cache entries after 5 seconds
    setTimeout(() => shopIdCache.delete(userId), 5000)

    return promise
}

export async function getShopInfo(shopId: string) {
    const { data, error } = await supabase
        .from("shops")
        .select("shop_name, shop_address, shop_email, shop_phone")
        .eq("id", shopId)
        .single()
    if (error) throw error
    return data
}

export async function getShopName(shopId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('shops')
        .select('shop_name')
        .eq('id', shopId)
        .single();

    if (error) {
        console.error("Error fetching shop name:", error);
        return null;
    }

    return data?.shop_name || null;
}
