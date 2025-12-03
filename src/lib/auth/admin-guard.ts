// Admin route protection - DEPRECATED
// Use @/lib/auth/guards and @/lib/auth/roles instead

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRole, isUserAdmin as checkUserAdmin } from './roles'

/**
 * @deprecated Use createAdminGuard from @/lib/auth/guards instead
 */
export async function adminGuard(request: NextRequest) {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user role from database
    const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    // If database error or user not found, redirect to login
    if (dbError || !userData) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin using consolidated role check
    if (!isAdminRole(userData.role)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // User is admin, allow access
    return null // null means continue to the requested route
}

/**
 * @deprecated Use isUserAdmin from @/lib/auth/roles instead
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    return checkUserAdmin(userId)
}