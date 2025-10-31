export type AdminType = 'super-admin' | 'organization-admin' | 'shop-admin'

export interface AdminContext {
    adminType: AdminType | null
    organizationId?: string | null
    shopId?: string | null
    userId?: string
    loading: boolean
    error?: string | null
}

export interface AdminUser {
    id: string
    role: string
    shop_id?: string | null
    organization_id?: string | null
    email?: string
    full_name?: string
}

export interface AdminOrganization {
    id: string
    name: string
    organization_type: 'mso' | 'franchise' | 'corporate'
    billing_email?: string
    subscription_plan?: string
    status: 'active' | 'suspended' | 'inactive'
    created_at: string
    updated_at: string
}

export interface AdminShop {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    organization_id?: string | null
    created_at: string
}

