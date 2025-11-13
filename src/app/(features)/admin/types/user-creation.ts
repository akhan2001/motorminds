export type UserRole = 'customer' | 'mechanic' | 'shop_owner' | 'admin' | 'super-admin'
export type UserPlan = 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface AdminUserFormData {
    email: string
    password: string
    fullName: string
    phone: string
    role: UserRole
    plan: UserPlan
    status: UserStatus
    shop_id?: string | null
    organization_id?: string | null
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

export interface UserCreationLimit {
    limit: number
    maxTotal?: number
    current: number
    remaining: number
    canCreate: boolean
}

export interface UserCreationLimitResponse {
    limit: number
    maxTotal?: number
    current: number
    remaining: number
    canCreate: boolean
}
