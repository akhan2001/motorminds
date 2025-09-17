// Admin route protection

import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function adminGuard(request: NextRequest) {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get user role from database
    const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // If database error or user not found, redirect to login
    if (dbError || !userData) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is admin (case-insensitive)
    if (userData.role?.toUpperCase() !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // User is admin, allow access
    return null; // null means continue to the requested route
}

export async function isUserAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !userData) {
        return false;
    }

    return userData.role?.toUpperCase() === 'ADMIN';
}