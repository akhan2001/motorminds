export interface UserFormData {
    email: string
    password: string
    confirmPassword: string
    fullName: string
    phone: string
}

export interface ShopFormData {
    shopName: string
    shopEmail: string
    shopPhone: string
    shopAddress: string
    shopCity: string
    shopProvince: string
    website: string
    businessNumber: string
    hstNumber: string
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