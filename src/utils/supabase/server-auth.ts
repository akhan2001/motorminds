import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getServerSupabase() {
	return createClient(supabaseUrl, supabaseAnonKey)
}

export async function checkUserOnServer(token?: string | null) {
	if (!token) return null
	const supabase = getServerSupabase()
	const {
		data: { user },
	} = await supabase.auth.getUser(token)
	return user
} 