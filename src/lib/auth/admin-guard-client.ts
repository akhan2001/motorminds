// Client-side admin role checking

import { createClient } from '@/utils/supabase/client'

export async function isUserAdminClient(userId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !userData) {
        return false
    }

    return userData.role?.toUpperCase() === 'ADMIN'
}

export async function getCurrentUserIsAdmin(): Promise<boolean> {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return false
    }

    // Check if user is admin
    return await isUserAdminClient(user.id)
}
