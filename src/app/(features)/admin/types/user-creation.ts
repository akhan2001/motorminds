export interface AdminUserFormData {
    email: string
    password: string
    fullName: string
    phone: string
    role: 'user' | 'admin' | 'demo' | 'super'
    plan: 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE'
    status: 'active' | 'inactive' | 'suspended'
}

export interface AdminShopFormData {
    shopName: string
    shopEmail: string
    shopPhone: string
    shopAddress: string
    shopCity: string
    shopProvince: string
    website: string
    businessNumber: string | null
    hstNumber: string | null
    servicesOffered: string[]
    tagline?: string
    about?: string
    operatingHours: {
        Monday: { openTime: string; closeTime: string; closed: boolean }
        Tuesday: { openTime: string; closeTime: string; closed: boolean }
        Wednesday: { openTime: string; closeTime: string; closed: boolean }
        Thursday: { openTime: string; closeTime: string; closed: boolean }
        Friday: { openTime: string; closeTime: string; closed: boolean }
        Saturday: { openTime: string; closeTime: string; closed: boolean }
        Sunday: { openTime: string; closeTime: string; closed: boolean }
    }
}

export interface CreateUserRequest {
    user: AdminUserFormData
    shop?: AdminShopFormData
    createShop: boolean
}

export interface CreateUserResponse {
    success: boolean
    userId?: string
    shopId?: string
    message: string
}
