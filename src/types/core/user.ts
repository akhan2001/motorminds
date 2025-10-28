export type UserRole = 'admin' | 'super' | 'demo' | 'user' | 'shop_admin';
export type AdminType = 'super-admin' | 'organization-admin' | 'shop-admin' | null;

export interface UserWithRole {
    id: string;
    role: UserRole;
    shop_id: string;
    organization_id?: string | null;
    created_at: string;
    plan: string;
    status: string;
}

export interface UserContext {
    userId: string;
    role: UserRole;
    shopId?: string | null;
    organizationId?: string | null;
    adminType?: AdminType;
}

export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: any;
}
