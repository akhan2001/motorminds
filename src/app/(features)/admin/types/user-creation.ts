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
    shopOwner?: string
    shopAbout?: string
    shopTagline?: string
    defaultHourlyRate?: number
    website: string
    businessNumber: string | null
    hstNumber: string | null
    servicesOffered: string[]
    operatingHours: {
        monday: { open: string; close: string; closed: boolean }
        tuesday: { open: string; close: string; closed: boolean }
        wednesday: { open: string; close: string; closed: boolean }
        thursday: { open: string; close: string; closed: boolean }
        friday: { open: string; close: string; closed: boolean }
        saturday: { open: string; close: string; closed: boolean }
        sunday: { open: string; close: string; closed: boolean }
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
