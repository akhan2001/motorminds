// src/app/(features)/admin/types/admin.ts

import type { Organization } from './organization'

export type AdminType = 'super-admin' | 'organization-admin' | 'shop-admin'

export interface Shop {
    id: string
    shop_name: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    website?: string
    operating_hours?: any
    services_offered?: any
    created_at: string
    shop_city?: string
    shop_owner?: string
    shop_province?: string
    banner_image_url?: string
    logo_image_url?: string
    facebook_url?: string
    twitter_url?: string
    instagram_url?: string
    youtube_url?: string
    shop_about?: string
    shop_tagline?: string
    hst_number?: string
    business_number?: string
    authorized_domains?: string[]
    widget_config?: any
    organization_id?: string
    organization_name?: string
    default_hourly_rate?: number
    status_tracker_presets?: any
    // Computed fields from users
    total_users?: number
    total_revenue?: number
    primary_user_plan?: string
    primary_user_status?: string
}

export interface User {
    id: string
    created_at: string
    role: string
    shop_id?: string
    organization_id?: string
    plan: string
    status: string
    email?: string
    full_name?: string
    shop_name?: string
    last_login?: string
    phone?: string
}

export interface AdminStats {
    totalShops?: number
    totalUsers?: number
    activeUsers?: number
    inactiveUsers?: number
    suspendedUsers?: number
    planDistribution?: {
        DEFAULT: number
        PREMIUM: number
        ENTERPRISE: number
    }
    // Super admin stats
    totalOrganizations?: number
    platformRevenue?: number
    // Organization admin stats
    organizationRevenue?: number
    activeWorkOrders?: number
    // Shop admin stats
    shopRevenue?: number
    partsInventory?: number
}

export interface UsersByShop {
    shop_id: string
    user_count: number
}

export interface ShopWithUsers extends Shop {
    users: User[]
}

export interface AdminContext {
    adminType: AdminType | null
    organizationId: string | null
    shopId: string | null
    loading: boolean
    error: string | null
}