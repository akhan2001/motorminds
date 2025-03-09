import { supabase } from "@/lib/supabase"

export async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}