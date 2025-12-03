// DEPRECATED: Use @/utils/supabase/server instead
// This file will be removed in a future version

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * @deprecated Use createClient from @/utils/supabase/server instead
 */
export function getServerSupabase() {
	return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * @deprecated Use getCurrentUser from @/lib/auth instead
 */
export async function checkUserOnServer(token?: string | null) {
	if (!token) return null
	const supabase = getServerSupabase()
	const {
		data: { user },
	} = await supabase.auth.getUser(token)
	return user
} 