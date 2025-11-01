import type { UserRole, AdminType } from '@/types/core/user';
import { navigationConfig } from '@/data/configs/navigation';

/**
 * Maps database roles (which can be any text) to valid UserRole types
 * Database may have 'super-admin' but TypeScript UserRole doesn't include it
 */
function mapDatabaseRoleToUserRole(dbRole: string | null | undefined): UserRole | null {
    if (!dbRole) return null;
    
    const normalized = dbRole.toLowerCase().trim();
    
    // Map database roles to valid UserRole types
    if (normalized === 'super-admin') {
        return 'admin'; // Map super-admin to admin for navigation purposes
    }
    if (normalized === 'shop_admin' || normalized === 'shop-admin') {
        return 'shop_admin';
    }
    
    // Check if it's already a valid UserRole
    const validRoles: UserRole[] = ['admin', 'super', 'demo', 'user', 'shop_admin'];
    if (validRoles.includes(normalized as UserRole)) {
        return normalized as UserRole;
    }
    
    return null;
}

export function getFilteredNavItems(userRole: UserRole | string | null, adminType?: AdminType) {
    // Map database role to valid UserRole type
    const mappedRole = typeof userRole === 'string' ? mapDatabaseRoleToUserRole(userRole) : userRole;
    
    // Check if raw role suggests admin (before mapping)
    const rawRoleStr = typeof userRole === 'string' ? userRole.toLowerCase() : '';
    const isAdminRole = mappedRole === 'admin' || rawRoleStr === 'super-admin' || rawRoleStr === 'admin';
    
    if (!mappedRole && !adminType && !isAdminRole) return [];
    
    return navigationConfig.filter(item => {
        // Special handling for Admin items - show ONLY if role suggests admin AND (adminType is present OR might be loading)
        if (item.name === 'Admin') {
            // Only show Admin dropdown if:
            // 1. Role is admin/super-admin (isAdminRole = true)
            // 2. AND adminType is present OR might still be loading (for admin roles)
            // This ensures regular users (role='user') NEVER see Admin nav
            return isAdminRole && (adminType !== null || mappedRole === 'admin');
        }
        
        // For non-admin items, check role
        if (!mappedRole) return false;
        const hasRole = item.requiredRoles.includes(mappedRole);
        
        // If item has admin type restrictions, check admin type
        if (hasRole && item.adminTypes && adminType) {
            return item.adminTypes.includes(adminType);
        }
        
        return hasRole;
    }).map(item => {
        // Filter subitems based on admin type
        if (item.subItems) {
            // For Admin items: if adminType is still loading, show all subitems temporarily
            // Otherwise, filter based on adminType
            const shouldShowAll = item.name === 'Admin' && !adminType && isAdminRole;
            
            const filteredSubItems = item.subItems.filter(subItem => {
                // If subitem has adminTypes restriction
                if (subItem.adminTypes) {
                    // If Admin item and adminType still loading, show all temporarily
                    if (shouldShowAll) return true;
                    // Otherwise, only show if adminType is set and matches
                    if (!adminType) return false;
                    return subItem.adminTypes.includes(adminType);
                }
                // If no adminTypes restriction, show it
                return true;
            });
            
            return {
                ...item,
                subItems: filteredSubItems
            };
        }
        
        return item;
    });
}

export function hasNavAccess(route: string, userRole: UserRole | string | null, adminType?: AdminType): boolean {
    // Map database role to valid UserRole type
    const mappedRole = typeof userRole === 'string' ? mapDatabaseRoleToUserRole(userRole) : userRole;
    if (!mappedRole && !adminType) return false;
    
    const navItem = navigationConfig.find(item => 
        route.startsWith(item.href) || 
        item.subItems?.some(sub => route.startsWith(sub.href))
    );
    
    if (!navItem) return false;
    
    // Special handling for Admin routes - check adminType
    if (navItem.name === 'Admin' && adminType) {
        // Check if any subitem matches the route and adminType
        const matchingSubItem = navItem.subItems?.find(sub => 
            route.startsWith(sub.href) && 
            (!sub.adminTypes || sub.adminTypes.includes(adminType))
        );
        return !!matchingSubItem;
    }
    
    // Check role access
    if (!mappedRole) return false;
    const hasRole = navItem.requiredRoles.includes(mappedRole);
    if (!hasRole) return false;
    
    // Check admin type access if applicable
    if (navItem.adminTypes && adminType) {
        return navItem.adminTypes.includes(adminType);
    }
    
    // Check subitem admin type access
    const subItem = navItem.subItems?.find(sub => route.startsWith(sub.href));
    if (subItem?.adminTypes && adminType) {
        return subItem.adminTypes.includes(adminType);
    }
    
    return true;
}

export function isDemoUser(userRole: UserRole | null): boolean {
    return userRole === 'demo';
}

export function getAdminNavItems(adminType: AdminType) {
    if (!adminType) return [];
    
    const adminNav = navigationConfig.find(item => item.name === 'Admin');
    if (!adminNav?.subItems) return [];
    
    return adminNav.subItems.filter(subItem => {
        if (subItem.adminTypes) {
            return subItem.adminTypes.includes(adminType);
        }
        return true;
    });
}
