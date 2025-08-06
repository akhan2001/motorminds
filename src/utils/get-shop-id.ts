import { createClient } from "@/utils/supabase/server";

export async function getShopIdForUser() {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return null;
    }

    const { user } = session;
    // @ts-ignore
    if (user.app_metadata.shop_id) {
        // @ts-ignore
        return user.app_metadata.shop_id;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return null;
    }

    return profile.shop_id;
}
