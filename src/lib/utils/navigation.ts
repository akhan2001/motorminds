import type { UserRole, AdminType } from '@/types/core/user';
import { navigationConfig } from '@/data/configs/navigation';

export function getFilteredNavItems(userRole: UserRole | null, adminType?: AdminType) {
    if (!userRole) return [];
    
    return navigationConfig.filter(item => {
        // Check if user has required role
        const hasRole = item.requiredRoles.includes(userRole);
        
        // If item has admin type restrictions, check admin type
        if (hasRole && item.adminTypes && adminType) {
            return item.adminTypes.includes(adminType);
        }
        
        return hasRole;
    }).map(item => {
        // Filter subitems based on admin type
        if (item.subItems && adminType) {
            const filteredSubItems = item.subItems.filter(subItem => {
                if (subItem.adminTypes) {
                    return subItem.adminTypes.includes(adminType);
                }
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

export function hasNavAccess(route: string, userRole: UserRole | null, adminType?: AdminType): boolean {
    if (!userRole) return false;
    
    const navItem = navigationConfig.find(item => 
        route.startsWith(item.href) || 
        item.subItems?.some(sub => route.startsWith(sub.href))
    );
    
    if (!navItem) return false;
    
    // Check role access
    const hasRole = navItem.requiredRoles.includes(userRole);
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
