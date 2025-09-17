// src/app/(features)/admin/types/admin.ts

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
    plan: string
    status: string
}

export interface AdminStats {
    totalShops: number
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    suspendedUsers: number
    planDistribution: {
        DEFAULT: number
        PREMIUM: number
        ENTERPRISE: number
    }
}

export interface UsersByShop {
    shop_id: string
    user_count: number
}

export interface ShopWithUsers extends Shop {
    users: User[]
}