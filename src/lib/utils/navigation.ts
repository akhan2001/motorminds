import type { UserRole } from '@/types/core/user';
import { navigationConfig } from '@/data/configs/navigation';

export function getFilteredNavItems(userRole: UserRole | null) {
    if (!userRole) return [];
    
    return navigationConfig.filter(item => 
        item.requiredRoles.includes(userRole)
    );
}

export function hasNavAccess(route: string, userRole: UserRole | null): boolean {
    if (!userRole) return false;
    
    const navItem = navigationConfig.find(item => 
        route.startsWith(item.href) || 
        item.subItems?.some(sub => route.startsWith(sub.href))
    );
    
    return navItem ? navItem.requiredRoles.includes(userRole) : false;
}

export function isDemoUser(userRole: UserRole | null): boolean {
    return userRole === 'demo';
}
