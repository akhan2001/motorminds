export type UserRole = 'admin' | 'super' | 'demo' | 'user';

export interface UserWithRole {
    id: string;
    role: UserRole;
    shop_id: string;
    created_at: string;
    plan: string;
    status: string;
}

export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: any;
}
