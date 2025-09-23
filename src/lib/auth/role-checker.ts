// Role validation utilities

import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function checkRole(request: NextRequest, requiredRole: string) {
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

    // Check if user has required role
    if (userData.role !== requiredRole) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // User has required role, allow access
    return null; // null means continue to the requested route
}

export async function getUserRole(userId: string): Promise<string | null> {
    const supabase = await createClient();
    
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !userData) {
        return null;
    }

    return userData.role;
}