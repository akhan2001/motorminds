import type { InvoiceWithDetails } from './invoice'

export interface ShopBranding {
    id: string
    shop_name: string
    shop_owner: string
    logo_image_url?: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    business_number?: string
}

export interface InvoicePDFData {
    invoice: InvoiceWithDetails
    shop: ShopBranding
}

export type TemplateId = 'professional' | 'modern' | 'minimal' | 'detailed' | 'tony'

export interface TemplateMetadata {
    id: TemplateId
    name: string
    description: string
    thumbnail?: string
}

export interface TemplateRegistry {
    [key: string]: {
        component: React.ComponentType<InvoicePDFData>
        metadata: TemplateMetadata
    }
}

