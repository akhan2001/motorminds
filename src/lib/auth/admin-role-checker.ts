// Admin role validation utilities

import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type AdminType = 'super-admin' | 'organization-admin' | 'shop-admin' | null;

export interface AdminContext {
    adminType: AdminType;
    organizationId: string | null;
    shopId: string | null;
    userId: string;
}

/**
 * Determines the admin type based on user role and context
 */
export async function determineAdminType(
    userId: string,
    role: string | null,
    organizationId: string | null,
    shopId: string | null
): Promise<AdminType> {
    if (!role) return null;

    const userRole = role.toUpperCase();

    // Priority 1: Super Admin - MotorMinds platform admin
    if (userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN') {
        return 'super-admin';
    }

    // Priority 2: Organization Admin - MSO admin (has organization_id)
    if ((userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && organizationId) {
        return 'organization-admin';
    }

    // Priority 3: Shop Admin - Shop-level admin (role='admin' without organization_id)
    if (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') {
        return 'shop-admin';
    }

    return null;
}

/**
 * Checks if a user has admin privileges
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        
        const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            return false;
        }

        const userRole = userData.role?.toUpperCase();
        return (
            userRole === 'ADMIN' ||
            userRole === 'SUPER-ADMIN' ||
            userRole === 'SUPER_ADMIN' ||
            userRole === 'SHOP_ADMIN' ||
            userRole === 'ORGANIZATION_ADMIN'
        );
    } catch (error) {
        console.error('Error checking if user is admin:', error);
        return false;
    }
}

/**
 * Gets the full admin context for a user
 */
export async function getAdminContext(userId: string): Promise<AdminContext | null> {
    try {
        const supabase = await createClient();
        
        const { data: userData, error } = await supabase
            .from('users')
            .select('id, role, shop_id, organization_id')
            .eq('id', userId)
            .single();

        if (error || !userData) {
            return null;
        }

        let organizationId = userData.organization_id || null;
        let shopId = userData.shop_id || null;

        // If shop admin, check if shop belongs to an organization
        if (!organizationId && shopId) {
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', shopId)
                .single();
            
            if (shopData?.organization_id) {
                organizationId = shopData.organization_id;
            }
        }

        const adminType = await determineAdminType(
            userId,
            userData.role,
            organizationId,
            shopId
        );

        if (!adminType) {
            return null;
        }

        return {
            adminType,
            organizationId,
            shopId,
            userId: userData.id
        };
    } catch (error) {
        console.error('Error getting admin context:', error);
        return null;
    }
}

/**
 * Checks if a user has a specific admin type
 */
export async function hasAdminType(
    userId: string,
    requiredType: AdminType
): Promise<boolean> {
    if (!requiredType) return false;
    
    const context = await getAdminContext(userId);
    return context?.adminType === requiredType;
}

/**
 * Middleware helper to check admin access
 */
export async function checkAdminAccess(
    request: NextRequest,
    requiredType?: AdminType
): Promise<NextResponse | null> {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get admin context
    const adminContext = await getAdminContext(user.id);
    
    if (!adminContext) {
        return NextResponse.redirect(new URL('/operations/appointments', request.url));
    }

    // If specific admin type required, check it
    if (requiredType && adminContext.adminType !== requiredType) {
        return NextResponse.redirect(new URL('/operations/appointments', request.url));
    }

    // User has admin access
    return null; // null means continue to the requested route
}

