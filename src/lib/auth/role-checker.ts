// Role validation utilities - DEPRECATED
// Use @/lib/auth/roles instead

import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole as getRole, hasRole } from './roles'
import { UserRole } from './types'

/**
 * @deprecated Use guards from @/lib/auth/guards instead
 */
export async function checkRole(request: NextRequest, requiredRole: string) {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user role from database
    const role = await getRole(user.id)

    // Check if user has required role
    if (!hasRole(role, requiredRole)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // User has required role, allow access
    return null // null means continue to the requested route
}

/**
 * @deprecated Use getUserRole from @/lib/auth/roles instead
 */
export async function getUserRole(userId: string): Promise<string | null> {
    return getRole(userId)
}