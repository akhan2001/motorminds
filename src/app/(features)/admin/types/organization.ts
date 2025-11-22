export type OrganizationType = 'mso' | 'franchise' | 'corporate'
export type OrganizationStatus = 'active' | 'suspended' | 'inactive'

export interface Organization {
    id: string
    name: string
    organization_type: OrganizationType
    billing_email?: string
    subscription_plan?: string
    status: OrganizationStatus
    created_at: string
    updated_at?: string
    shop_count?: number
}

export interface OrganizationCreateData {
    name: string
    organization_type?: OrganizationType
    billing_email?: string
    subscription_plan?: string
    status?: OrganizationStatus
}

export interface OrganizationUpdateData {
    name?: string
    organization_type?: OrganizationType
    billing_email?: string
    subscription_plan?: string
    status?: OrganizationStatus
}

export interface OrganizationWithShops extends Organization {
    shops: Array<{
        id: string
        shop_name: string
        shop_email?: string
        shop_phone?: string
    }>
}

