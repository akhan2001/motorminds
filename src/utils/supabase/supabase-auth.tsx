// DEPRECATED: Use @/lib/auth instead
// This file will be removed in a future version

import { supabase } from "@/lib/supabase"

/**
 * @deprecated Use getCurrentUser from @/lib/auth instead
 */
export async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}