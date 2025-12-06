import { supabase } from "@/lib/supabase"

/**
 * Check if user is authenticated using getClaims()
 * getClaims() validates the JWT signature and is more robust than getUser()
 */
export async function checkUser() {
    const { data } = await supabase.auth.getClaims()
    if (!data?.claims) return null
    
    return {
        id: data.claims.sub,
        email: data.claims.email,
        // Add other user properties from claims as needed
    }
}